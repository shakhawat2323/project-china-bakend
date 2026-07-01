import { OrderStatus, PaymentMethod, PaymentStatus, UserRole } from "@prisma/client";
import paypal from "@paypal/checkout-server-sdk";
import httpStatus from "http-status";
import Stripe from "stripe";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";

type PaymentActor = {
    id: string;
    role: UserRole;
};

const stripe = new Stripe(config.stripe.secret_key as string, {
    apiVersion: "2025-01-27.acacia" as any,
});

const getPayPalClient = () => {
    const isLive = config.paypal.mode === "live";
    const Environment = isLive ? paypal.core.LiveEnvironment : paypal.core.SandboxEnvironment;
    const environment = new Environment(
        config.paypal.client_id as string,
        config.paypal.client_secret as string,
    );

    return new paypal.core.PayPalHttpClient(environment);
};

const executePayPalRequest = async <T>(request: T) => {
    try {
        const client = getPayPalClient();
        return await client.execute(request as any);
    } catch (error: any) {
        const rawMessage = error?._originalError?.text || error?.message || "";

        if (rawMessage.includes("invalid_client") || rawMessage.includes("Client Authentication failed")) {
            throw new ApiError(
                httpStatus.BAD_GATEWAY,
                `PayPal credentials are invalid for ${config.paypal.mode} mode. Check PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and PAYPAL_MODE.`,
            );
        }

        throw new ApiError(httpStatus.BAD_GATEWAY, rawMessage || "PayPal payment gateway request failed.");
    }
};

const assertOrderPayable = async (orderId: string, actor: PaymentActor) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: { include: { product: true } }, quote: true },
    });

    if (!order) {
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && order.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot pay for another customer's order.");
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Order is already paid.");
    }

    if (order.totalAmount <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Order has no payable amount.");
    }

    return order;
};

const createStripeCheckoutSession = async (orderId: string, actor: PaymentActor) => {
    const order = await assertOrderPayable(orderId, actor);

    const lineItems = order.orderItems.length
        ? order.orderItems.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.product.name,
                    metadata: {
                        productId: item.productId,
                    },
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }))
        : [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: order.quote?.name || "Custom PCB Manufacturing Order",
                        metadata: {
                            orderId: order.id,
                            quoteId: order.quoteId || "",
                        },
                    },
                    unit_amount: Math.round(order.totalAmount * 100),
                },
                quantity: 1,
            },
        ];

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${config.frontend_url}/payment-success?orderId=${order.id}&provider=stripe`,
        cancel_url: `${config.frontend_url}/checkout?orderId=${order.id}&payment=stripe-cancelled`,
        client_reference_id: order.id,
        customer_email: undefined,
        metadata: {
            orderId: order.id,
            userId: order.userId,
        },
    });

    await prisma.payment.create({
        data: {
            orderId: order.id,
            amount: order.totalAmount,
            currency: "USD",
            method: PaymentMethod.STRIPE,
            transactionId: session.id,
            status: PaymentStatus.PENDING,
            rawResponse: session as unknown as object,
        },
    });

    return {
        provider: "stripe",
        checkoutUrl: session.url,
        sessionId: session.id,
    };
};

const handleStripeWebhook = async (rawBody: Buffer, signature?: string) => {
    if (!signature) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Missing Stripe signature.");
    }

    if (!config.stripe.webhook_secret) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Stripe webhook secret is not configured.");
    }

    const event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhook_secret);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const orderId = session.client_reference_id || session.metadata?.orderId;

        if (!orderId) {
            return { received: true, ignored: true, reason: "Missing order id." };
        }

        await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findFirst({
                where: {
                    transactionId: session.id,
                    method: PaymentMethod.STRIPE,
                },
            });

            if (!payment) {
                await tx.payment.create({
                    data: {
                        orderId,
                        amount: (session.amount_total || 0) / 100,
                        currency: session.currency?.toUpperCase() || "USD",
                        method: PaymentMethod.STRIPE,
                        transactionId: session.id,
                        providerPaymentId:
                            typeof session.payment_intent === "string"
                                ? session.payment_intent
                                : session.payment_intent?.id,
                        status: PaymentStatus.PAID,
                        paidAt: new Date(),
                        rawResponse: session as unknown as object,
                    },
                });
            } else if (payment.status !== PaymentStatus.PAID) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: PaymentStatus.PAID,
                        providerPaymentId:
                            typeof session.payment_intent === "string"
                                ? session.payment_intent
                                : session.payment_intent?.id,
                        paidAt: new Date(),
                        rawResponse: session as unknown as object,
                    },
                });
            }

            await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: PaymentStatus.PAID,
                    status: OrderStatus.PAID,
                },
            });
        });
    }

    if (event.type === "checkout.session.expired") {
        const session = event.data.object as any;

        await prisma.payment.updateMany({
            where: {
                transactionId: session.id,
                method: PaymentMethod.STRIPE,
                status: PaymentStatus.PENDING,
            },
            data: {
                status: PaymentStatus.FAILED,
                failureReason: "Stripe checkout session expired.",
                rawResponse: session as unknown as object,
            },
        });
    }

    return { received: true, eventType: event.type };
};

const createPayPalOrder = async (orderId: string, actor: PaymentActor) => {
    const order = await assertOrderPayable(orderId, actor);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: "CAPTURE",
        purchase_units: [
            {
                reference_id: order.id,
                custom_id: order.id,
                amount: {
                    currency_code: "USD",
                    value: order.totalAmount.toFixed(2),
                },
            },
        ],
        application_context: {
            brand_name: "Wuping Feitian Electronic Technology",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            return_url: `${config.frontend_url}/payment-success?orderId=${order.id}&provider=paypal`,
            cancel_url: `${config.frontend_url}/checkout?orderId=${order.id}&payment=paypal-cancelled`,
        },
    });

    const response = await executePayPalRequest(request);

    await prisma.payment.create({
        data: {
            orderId: order.id,
            amount: order.totalAmount,
            currency: "USD",
            method: PaymentMethod.PAYPAL,
            transactionId: response.result.id,
            status: PaymentStatus.PENDING,
            rawResponse: response.result,
        },
    });

    const approveUrl = response.result.links.find((link: { rel: string; href: string }) => link.rel === "approve")?.href;

    if (!approveUrl) {
        throw new ApiError(httpStatus.BAD_GATEWAY, "PayPal approval URL was not returned.");
    }

    return {
        provider: "paypal",
        checkoutUrl: approveUrl,
        paypalOrderId: response.result.id,
        mode: config.paypal.mode,
    };
};

const capturePayPalOrder = async (paypalOrderId: string, actor: PaymentActor) => {
    const payment = await prisma.payment.findUnique({
        where: { transactionId: paypalOrderId },
        include: { order: true },
    });

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment record not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && payment.order.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot capture another customer's payment.");
    }

    if (payment.status === PaymentStatus.PAID) {
        return { success: true, message: "Payment was already captured." };
    }

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({} as never);

    const response = await executePayPalRequest(request);

    if (response.result.status !== "COMPLETED") {
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.FAILED,
                failureReason: `PayPal capture status: ${response.result.status}`,
                rawResponse: response.result,
            },
        });

        return { success: false, message: "Payment was not completed." };
    }

    const captureId = response.result.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    await prisma.$transaction([
        prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.PAID,
                providerPaymentId: captureId,
                paidAt: new Date(),
                rawResponse: response.result,
            },
        }),
        prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.PAID },
        }),
    ]);

    return { success: true, message: "Payment captured successfully." };
};

const getMyPaymentHistory = async (actor: PaymentActor) => {
    return prisma.payment.findMany({
        where: {
            order: {
                userId: actor.id,
            },
        },
        include: {
            order: {
                select: {
                    id: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

const getTransactions = async () => {
    return prisma.payment.findMany({
        include: {
            order: {
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

const getReceipt = async (paymentId: string, actor: PaymentActor) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            order: {
                include: {
                    orderItems: { include: { product: true } },
                    user: { select: { id: true, name: true, email: true, companyName: true } },
                },
            },
        },
    });

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && payment.order.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot access another customer's receipt.");
    }

    return {
        receiptNumber: `RCT-${payment.id.slice(0, 8).toUpperCase()}`,
        payment,
    };
};

const processRefund = async (paymentId: string) => {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
    });

    if (!payment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Payment not found.");
    }

    if (payment.status !== PaymentStatus.PAID) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only paid payments can be refunded.");
    }

    if (payment.method === PaymentMethod.STRIPE) {
        if (!payment.providerPaymentId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Stripe payment intent id is missing.");
        }

        const refund = await stripe.refunds.create({
            payment_intent: payment.providerPaymentId,
            reason: "requested_by_customer",
        });

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.REFUNDED,
                refundedAt: new Date(),
                rawResponse: refund as unknown as object,
            },
        });

        return { provider: "stripe", refundId: refund.id };
    }

    if (payment.method === PaymentMethod.PAYPAL) {
        if (!payment.providerPaymentId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "PayPal capture id is missing.");
        }

        const request = new paypal.payments.CapturesRefundRequest(payment.providerPaymentId);
        request.requestBody({
            amount: {
                currency_code: payment.currency,
                value: payment.amount.toFixed(2),
            },
        } as any);

        const response = await executePayPalRequest(request);

        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.REFUNDED,
                refundedAt: new Date(),
                rawResponse: response.result,
            },
        });

        return { provider: "paypal", refundId: response.result.id };
    }

    throw new ApiError(httpStatus.BAD_REQUEST, "Refund is not supported for this payment method.");
};

export const PaymentService = {
    createStripeCheckoutSession,
    handleStripeWebhook,
    createPayPalOrder,
    capturePayPalOrder,
    getMyPaymentHistory,
    getTransactions,
    getReceipt,
    processRefund,
};

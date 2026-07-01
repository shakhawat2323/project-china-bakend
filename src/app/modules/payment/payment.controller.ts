import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

type AuthRequest = Request & {
    user?: {
        id?: string;
        userId?: string;
        role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
    };
};

const getActor = (req: AuthRequest) => ({
    id: String(req.user?.id || req.user?.userId),
    role: req.user?.role || "CUSTOMER",
});

const createStripeCheckoutSession = catchAsync(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.body;
    const result = await PaymentService.createStripeCheckoutSession(orderId, getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Stripe checkout session created successfully.",
        data: result,
    });
});

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    const result = await PaymentService.handleStripeWebhook(
        req.body as Buffer,
        Array.isArray(signature) ? signature[0] : signature,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Stripe webhook processed successfully.",
        data: result,
    });
});

const createPayPalOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { orderId } = req.body;
    const result = await PaymentService.createPayPalOrder(orderId, getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "PayPal order created successfully.",
        data: result,
    });
});

const capturePayPalOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { paypalOrderId } = req.body;
    const result = await PaymentService.capturePayPalOrder(paypalOrderId, getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: result.success,
        message: result.message,
        data: result,
    });
});

const getMyPaymentHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await PaymentService.getMyPaymentHistory(getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment history fetched successfully.",
        data: result,
    });
});

const getTransactions = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.getTransactions();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Transactions fetched successfully.",
        data: result,
    });
});

const getReceipt = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await PaymentService.getReceipt(String(req.params.paymentId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment receipt fetched successfully.",
        data: result,
    });
});

const processRefund = catchAsync(async (req: Request, res: Response) => {
    const result = await PaymentService.processRefund(String(req.params.paymentId));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Refund processed successfully.",
        data: result,
    });
});

export const PaymentController = {
    createStripeCheckoutSession,
    handleStripeWebhook,
    createPayPalOrder,
    capturePayPalOrder,
    getMyPaymentHistory,
    getTransactions,
    getReceipt,
    processRefund,
};

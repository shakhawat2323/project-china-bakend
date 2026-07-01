import { z } from "zod";

const createPayment = z.object({
    body: z.object({
        orderId: z.string().uuid("Valid order ID is required"),
    }),
});

const capturePayPalPayment = z.object({
    body: z.object({
        paypalOrderId: z.string().min(1, "PayPal order ID is required"),
    }),
});

const paymentIdParam = z.object({
    params: z.object({
        paymentId: z.string().uuid("Valid payment ID is required"),
    }),
});

export const PaymentValidation = {
    createPayment,
    capturePayPalPayment,
    paymentIdParam,
};

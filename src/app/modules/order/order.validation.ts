import { z } from "zod";

const createOrder = z.object({
    body: z.object({
        shippingAddress: z.string().min(1, "Shipping address is required"),
        billingAddress: z.string().optional(),
    }),
});

const orderIdParam = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
});

const updateOrderStatus = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        status: z.enum([
            "PENDING",
            "PAID",
            "GERBER_REVIEW",
            "ENGINEERING_REVIEW",
            "PRODUCTION",
            "QUALITY_CONTROL",
            "PACKAGING",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
        ]),
        note: z.string().max(500).optional(),
    }),
});

export const OrderValidation = {
    createOrder,
    orderIdParam,
    updateOrderStatus,
};

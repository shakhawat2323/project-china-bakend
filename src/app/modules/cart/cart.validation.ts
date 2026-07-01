import { z } from "zod";

const addToCart = z.object({
    body: z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.preprocess((value) => value === undefined ? 1 : Number(value), z.number().int().min(1, "Quantity must be at least 1")).optional().default(1),
    }),
});

const updateCartItem = z.object({
    body: z.object({
        quantity: z.preprocess((value) => Number(value), z.number().int().min(1, "Quantity must be at least 1")),
    }),
});

export const CartValidation = {
    addToCart,
    updateCartItem,
};

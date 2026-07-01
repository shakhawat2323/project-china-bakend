import { z } from "zod";

const createReview = z.object({
    body: z.object({
        rating: z.coerce.number().int().min(1).max(5),
        comment: z.string().trim().max(1000).optional(),
    }),
    params: z.object({
        productId: z.string().uuid(),
    }),
});

const updateReview = z.object({
    body: z.object({
        rating: z.coerce.number().int().min(1).max(5).optional(),
        comment: z.string().trim().max(1000).optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const ReviewValidation = {
    createReview,
    updateReview,
};

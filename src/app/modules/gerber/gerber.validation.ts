import { z } from "zod";

const uploadGerber = z.object({
    body: z.object({
        quoteId: z.string().uuid().optional(),
    }),
});

const gerberIdParam = z.object({
    params: z.object({
        gerberId: z.string().uuid(),
    }),
});

const reviewGerber = z.object({
    params: z.object({
        gerberId: z.string().uuid(),
    }),
    body: z.object({
        status: z.enum(["REVIEWING", "APPROVED", "REJECTED"]),
        message: z.string().max(500).optional(),
    }),
});

export const GerberValidation = {
    uploadGerber,
    gerberIdParam,
    reviewGerber,
};

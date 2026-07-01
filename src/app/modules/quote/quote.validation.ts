import { z } from "zod";

const quotePayload = z.object({
    name: z.string().trim().min(2).max(120).default("Untitled PCB"),
    width: z.number().positive(),
    height: z.number().positive(),
    quantity: z.number().int().positive(),
    layerCount: z.number().int().positive(),
    materialType: z.string().trim().min(2),
    boardThickness: z.number().positive(),
    copperWeight: z.number().positive(),
    surfaceFinish: z.string().trim().min(2),
    solderMaskColor: z.string().trim().min(2),
    silkscreenColor: z.string().trim().min(2),
});

const createQuote = z.object({
    body: quotePayload,
});

const quoteIdParam = z.object({
    params: z.object({
        quoteId: z.string().uuid(),
    }),
});

const convertToOrder = z.object({
    params: z.object({
        quoteId: z.string().uuid(),
    }),
    body: z.object({
        shippingAddress: z.string().min(1, "Shipping address is required"),
        billingAddress: z.string().optional(),
    }),
});

export const QuoteValidation = {
    createQuote,
    quoteIdParam,
    convertToOrder,
};

import { z } from "zod";

const createTicket = z.object({
    body: z.object({
        subject: z.string().trim().min(3).max(160),
        message: z.string().trim().min(2).max(5000),
    }),
});

const replyTicket = z.object({
    params: z.object({
        ticketId: z.string().uuid(),
    }),
    body: z.object({
        message: z.string().trim().min(2).max(5000),
    }),
});

const ticketIdParam = z.object({
    params: z.object({
        ticketId: z.string().uuid(),
    }),
});

export const SupportValidation = {
    createTicket,
    replyTicket,
    ticketIdParam,
};

import { z } from "zod";

const createRoom = z.object({
    body: z.object({
        subject: z.string().trim().max(160).optional(),
        adminId: z.string().uuid().optional(),
    }),
});

const roomIdParam = z.object({
    params: z.object({
        roomId: z.string().uuid(),
    }),
});

const sendMessage = z.object({
    params: z.object({
        roomId: z.string().uuid(),
    }),
    body: z.object({
        message: z.string().trim().max(5000).optional(),
        files: z.array(z.string().url()).default([]),
    }).refine((value) => Boolean(value.message || value.files.length), {
        message: "Message or file is required",
    }),
});

export const ChatValidation = {
    createRoom,
    roomIdParam,
    sendMessage,
};

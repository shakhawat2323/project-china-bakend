import { z } from "zod";

const notificationIdParam = z.object({
    params: z.object({
        notificationId: z.string().uuid(),
    }),
});

const broadcast = z.object({
    body: z.object({
        userIds: z.array(z.string().uuid()).min(1),
        title: z.string().trim().min(2).max(120),
        message: z.string().trim().min(2).max(1000),
        type: z.string().optional(),
        link: z.string().optional(),
    }),
});

export const NotificationValidation = {
    notificationIdParam,
    broadcast,
};

import { UserStatus } from "@prisma/client";
import { z } from "zod";

const updateCustomerStatus = z.object({
    body: z.object({
        status: z.enum(UserStatus),
    }),
    params: z.object({
        userId: z.string().uuid(),
    }),
});

const createCategory = z.object({
    body: z.object({
        name: z.string().trim().min(2),
        slug: z.string().trim().min(2).optional(),
        description: z.string().trim().optional(),
        icon: z.string().trim().optional(),
        order: z.coerce.number().int().optional(),
    }),
});

const updateCategory = z.object({
    body: z.object({
        name: z.string().trim().min(2).optional(),
        slug: z.string().trim().min(2).optional(),
        description: z.string().trim().optional(),
        icon: z.string().trim().optional(),
        order: z.coerce.number().int().optional(),
    }),
    params: z.object({
        id: z.string().uuid(),
    }),
});

export const AdminValidation = {
    updateCustomerStatus,
    createCategory,
    updateCategory,
};

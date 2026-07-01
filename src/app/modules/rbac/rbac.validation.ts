import { z } from "zod";
import { permissionCatalog } from "../../shared/permissions";

const permissionKeys = permissionCatalog.map((item) => item.key) as unknown as [string, ...string[]];

const createAdmin = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().transform((value) => value.toLowerCase()),
        password: z.string().min(8),
        phone: z.string().optional(),
        permissions: z.array(z.enum(permissionKeys)).optional(),
    }),
});

const createRole = z.object({
    body: z.object({
        name: z.string().trim().min(2).max(80),
        slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
        description: z.string().max(300).optional(),
        permissions: z.array(z.enum(permissionKeys)).default([]),
    }),
});

const updateRole = z.object({
    params: z.object({
        id: z.string().uuid(),
    }),
    body: z.object({
        name: z.string().trim().min(2).max(80).optional(),
        description: z.string().max(300).optional(),
        permissions: z.array(z.enum(permissionKeys)).optional(),
        isActive: z.boolean().optional(),
    }),
});

const assignRole = z.object({
    body: z.object({
        userId: z.string().uuid(),
        roleId: z.string().uuid(),
    }),
});

const userIdParam = z.object({
    params: z.object({
        userId: z.string().uuid(),
    }),
});

export const RbacValidation = {
    createAdmin,
    createRole,
    updateRole,
    assignRole,
    userIdParam,
};

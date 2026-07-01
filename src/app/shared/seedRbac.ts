import { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { permissionCatalog, rolePermissionMap } from "./permissions";

const roleLabels: Record<UserRole, string> = {
    CUSTOMER: "Customer",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
};

const roleDescriptions: Record<UserRole, string> = {
    CUSTOMER: "Buyer access for quotes, Gerber uploads, orders, payments, tracking, support, and notifications.",
    ADMIN: "Daily operations access for products, customers, quotes, Gerber review, orders, production, support, coupons, reviews, notifications, and shipping.",
    SUPER_ADMIN: "Full platform owner access for business, admins, roles, system settings, security, monitoring, analytics, pricing, CMS, backups, and audit logs.",
};

export const seedRbac = async () => {
    for (const role of Object.values(UserRole)) {
        await prisma.accessRole.upsert({
            where: { slug: role.toLowerCase().replace(/_/g, "-") },
            update: {
                name: roleLabels[role],
                description: roleDescriptions[role],
                systemRole: role,
                permissions: rolePermissionMap[role],
                isSystem: true,
                isActive: true,
            },
            create: {
                name: roleLabels[role],
                slug: role.toLowerCase().replace(/_/g, "-"),
                description: roleDescriptions[role],
                systemRole: role,
                permissions: rolePermissionMap[role],
                isSystem: true,
                isActive: true,
            },
        });
    }

    console.log(`✅ RBAC seeded: ${permissionCatalog.length} permissions, ${Object.values(UserRole).length} system roles`);
};

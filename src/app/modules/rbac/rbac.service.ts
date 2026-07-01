import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { UserRole, UserStatus } from "@prisma/client";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import { permissionCatalog, Permission, rolePermissionMap } from "../../shared/permissions";
import { prisma } from "../../shared/prisma";

const getPermissionSummary = () => {
    return {
        permissions: permissionCatalog,
        defaultRoles: rolePermissionMap,
        summary: {
            customer: "Buy products, request quotes, upload Gerber, make payments, track orders, and create tickets.",
            admin: "Manage products, customers, orders, Gerber reviews, quotes, production, support, coupons, reviews, notifications, and shipping.",
            superAdmin: "Full platform control across admins, roles, settings, security, analytics, pricing, CMS, backups, monitoring, and audit logs.",
        },
    };
};

const getRoles = async () => {
    return prisma.accessRole.findMany({
        orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        include: {
            _count: {
                select: { users: true },
            },
        },
    });
};

const createRole = async (payload: {
    name: string;
    slug: string;
    description?: string;
    permissions: Permission[];
}) => {
    const existingRole = await prisma.accessRole.findUnique({
        where: { slug: payload.slug },
    });

    if (existingRole) {
        throw new ApiError(httpStatus.CONFLICT, "Role slug already exists.");
    }

    return prisma.accessRole.create({
        data: {
            ...payload,
            isSystem: false,
            isActive: true,
        },
    });
};

const updateRole = async (
    id: string,
    payload: {
        name?: string;
        description?: string;
        permissions?: Permission[];
        isActive?: boolean;
    },
) => {
    const role = await prisma.accessRole.findUnique({ where: { id } });

    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, "Role not found.");
    }

    if (role.isSystem && payload.permissions) {
        throw new ApiError(httpStatus.BAD_REQUEST, "System role permissions are managed by the platform catalog.");
    }

    return prisma.accessRole.update({
        where: { id },
        data: payload,
    });
};

const deleteRole = async (id: string) => {
    const role = await prisma.accessRole.findUnique({ where: { id } });

    if (!role) {
        throw new ApiError(httpStatus.NOT_FOUND, "Role not found.");
    }

    if (role.isSystem) {
        throw new ApiError(httpStatus.BAD_REQUEST, "System roles cannot be deleted.");
    }

    return prisma.accessRole.delete({ where: { id } });
};

const createAdmin = async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    permissions?: Permission[];
}) => {
    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });

    if (existingUser) {
        throw new ApiError(httpStatus.CONFLICT, "Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt_round));
    const adminRole = await prisma.accessRole.findUnique({ where: { slug: "admin" } });

    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: payload.email,
                password: hashedPassword,
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                isVerified: true,
                needPasswordChange: true,
                name: payload.name,
                phone: payload.phone,
            },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                name: true,
                phone: true,
                createdAt: true,
            },
        });

        await tx.admin.create({
            data: {
                userId: user.id,
                email: user.email,
                name: payload.name,
                contactNumber: payload.phone,
            },
        });

        if (adminRole) {
            await tx.userAccessRole.create({
                data: {
                    userId: user.id,
                    roleId: adminRole.id,
                },
            });
        }

        if (payload.permissions?.length) {
            const customRole = await tx.accessRole.create({
                data: {
                    name: `${payload.name} Custom Permissions`,
                    slug: `admin-${user.id}`,
                    description: "Admin-specific permission override role.",
                    permissions: payload.permissions,
                    isSystem: false,
                    isActive: true,
                },
            });

            await tx.userAccessRole.create({
                data: {
                    userId: user.id,
                    roleId: customRole.id,
                },
            });
        }

        return user;
    });
};

const getAdmins = async () => {
    return prisma.user.findMany({
        where: {
            role: UserRole.ADMIN,
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            status: true,
            isVerified: true,
            createdAt: true,
            accessRoles: {
                include: {
                    role: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

const suspendAdmin = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found.");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.BLOCKED },
        select: { id: true, email: true, role: true, status: true, name: true },
    });
};

const activateAdmin = async (userId: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== UserRole.ADMIN) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found.");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ACTIVE },
        select: { id: true, email: true, role: true, status: true, name: true },
    });
};

const assignRoleToUser = async (payload: { userId: string; roleId: string; assignedBy?: string }) => {
    const [user, role] = await Promise.all([
        prisma.user.findUnique({ where: { id: payload.userId } }),
        prisma.accessRole.findUnique({ where: { id: payload.roleId } }),
    ]);

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
    }

    if (!role || !role.isActive) {
        throw new ApiError(httpStatus.NOT_FOUND, "Role not found or inactive.");
    }

    return prisma.userAccessRole.upsert({
        where: {
            userId_roleId: {
                userId: payload.userId,
                roleId: payload.roleId,
            },
        },
        update: {},
        create: {
            userId: payload.userId,
            roleId: payload.roleId,
            assignedBy: payload.assignedBy,
        },
        include: { role: true },
    });
};

export const RbacService = {
    getPermissionSummary,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    createAdmin,
    getAdmins,
    suspendAdmin,
    activateAdmin,
    assignRoleToUser,
};

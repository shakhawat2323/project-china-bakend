import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";
import { prisma } from "../shared/prisma";
import { Permission, rolePermissionMap } from "../shared/permissions";
import { UserRole } from "@prisma/client";

type AuthenticatedRequest = Request & {
    user?: {
        id?: string;
        userId?: string;
        role?: UserRole;
        email?: string;
        permissions?: Permission[];
    };
};

const resolveUserPermissions = async (userId: string, fallbackRole?: UserRole) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            accessRoles: {
                include: {
                    role: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User does not exist anymore!");
    }

    const basePermissions = rolePermissionMap[user.role] || rolePermissionMap[fallbackRole || "CUSTOMER"] || [];
    const assignedPermissions = user.accessRoles
        .filter((item) => item.role.isActive)
        .flatMap((item) => item.role.permissions as Permission[]);

    return Array.from(new Set([...basePermissions, ...assignedPermissions]));
};

const requirePermission = (...requiredPermissions: Permission[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id || req.user?.userId;

            if (!userId) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            const userPermissions = await resolveUserPermissions(userId, req.user?.role);
            req.user = {
                ...req.user,
                permissions: userPermissions,
            };

            const allowed = requiredPermissions.every((permission) => userPermissions.includes(permission));

            if (!allowed) {
                throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to perform this action.");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const requireAnyPermission = (...allowedPermissions: Permission[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?.id || req.user?.userId;

            if (!userId) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            const userPermissions = await resolveUserPermissions(userId, req.user?.role);
            req.user = {
                ...req.user,
                permissions: userPermissions,
            };

            const allowed = allowedPermissions.some((permission) => userPermissions.includes(permission));

            if (!allowed) {
                throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission to perform this action.");
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default requirePermission;

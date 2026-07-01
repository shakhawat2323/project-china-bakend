import { NextFunction, Request, Response } from "express";
import { UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";
import { jwtHelper } from "../helper/jwtHelper";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import { prisma } from "../shared/prisma";

const auth = (...roles: UserRole[]) => {
    return async (
        req: Request & { user?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            const token = req.cookies.accessToken;

            if (!token) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            const verifyUser = jwtHelper.verifyToken(
                token,
                config.jwt.jwt_secret as Secret
            );

            // Advanced Security: Verify user exists in DB and is not blocked
            const userId = verifyUser.id || verifyUser.userId;
            const dbUser = await prisma.user.findUnique({ where: { id: userId } });

            if (!dbUser) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "User does not exist anymore!");
            }

            if (dbUser.status === UserStatus.BLOCKED || dbUser.status === UserStatus.DELETED) {
                throw new ApiError(httpStatus.FORBIDDEN, "Your account has been restricted!");
            }

            // if (!dbUser.isVerified) {
            //     throw new ApiError(httpStatus.FORBIDDEN, "Please verify your account to access this feature!");
            // }

            req.user = verifyUser;

            if (roles.length && !roles.includes(dbUser.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, `Access Denied! ${dbUser.role} cannot access this resource.`);
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

export default auth;

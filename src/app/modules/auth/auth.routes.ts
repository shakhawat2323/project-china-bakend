import express from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import { AuthValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
    "/register",
    validateRequest(AuthValidation.register),
    AuthController.register
);

router.post(
    "/login",
    validateRequest(AuthValidation.login),
    AuthController.login
);

router.post("/logout", AuthController.logout);

router.get("/me", auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER), AuthController.getMe);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
    "/change-password",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER),
    validateRequest(AuthValidation.changePassword),
    AuthController.changePassword
);

router.post(
    "/forgot-password",
    validateRequest(AuthValidation.forgotPassword),
    AuthController.forgotPassword
);

router.post(
    "/reset-password",
    validateRequest(AuthValidation.resetPassword),
    AuthController.resetPassword
);

router.post(
    "/verify-email",
    validateRequest(AuthValidation.verifyEmail),
    AuthController.verifyEmail
);

router.post(
    "/resend-verification",
    validateRequest(AuthValidation.resendVerificationEmail),
    AuthController.resendVerificationEmail
);

router.get(
    "/me",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER),
    AuthController.getMe
);

router.patch(
    "/update-profile",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CUSTOMER),
    AuthController.updateProfile
);

export const authRoutes = router;

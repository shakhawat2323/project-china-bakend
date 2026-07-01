import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import requirePermission from "../../middlewares/requirePermission";
import validateRequest from "../../middlewares/validateRequest";
import { permissions } from "../../shared/permissions";
import { NotificationController } from "./notification.controller";
import { NotificationValidation } from "./notification.validation";

const router = express.Router();

router.get(
    "/",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.notification.readOwn),
    NotificationController.getMyNotifications,
);

router.patch(
    "/read-all",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.notification.readOwn),
    NotificationController.markAllAsRead,
);

router.patch(
    "/:notificationId/read",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.notification.readOwn),
    validateRequest(NotificationValidation.notificationIdParam),
    NotificationController.markAsRead,
);

router.post(
    "/broadcast",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.notification.broadcast),
    validateRequest(NotificationValidation.broadcast),
    NotificationController.broadcast,
);

export const notificationRoutes = router;

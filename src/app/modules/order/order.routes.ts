import express from "express";
import { OrderController } from "./order.controller";
import validateRequest from "../../middlewares/validateRequest";
import { OrderValidation } from "./order.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import requirePermission, { requireAnyPermission } from "../../middlewares/requirePermission";
import { permissions } from "../../shared/permissions";

const router = express.Router();

router.post(
    "/",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.order.create),
    validateRequest(OrderValidation.createOrder),
    OrderController.createOrder
);

router.get(
    "/",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.order.readOwn, permissions.order.readAll),
    OrderController.getMyOrders
);

router.get(
    "/:id",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.order.readOwn, permissions.order.readAll),
    validateRequest(OrderValidation.orderIdParam),
    OrderController.getOrderById
);

router.patch(
    "/:id/status",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.order.updateStatus),
    validateRequest(OrderValidation.updateOrderStatus),
    OrderController.updateOrderStatus
);

router.patch(
    "/:id/cancel",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.order.cancelOwn, permissions.order.updateStatus),
    validateRequest(OrderValidation.orderIdParam),
    OrderController.cancelOrder
);

export const orderRoutes = router;

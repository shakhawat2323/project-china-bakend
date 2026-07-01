import express from "express";
import { CartController } from "./cart.controller";
import validateRequest from "../../middlewares/validateRequest";
import { CartValidation } from "./cart.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import requirePermission from "../../middlewares/requirePermission";
import { permissions } from "../../shared/permissions";

const router = express.Router();

router.post(
    "/",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.order.create),
    validateRequest(CartValidation.addToCart),
    CartController.addToCart
);

router.get(
    "/",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.order.readOwn),
    CartController.getMyCart
);

router.patch(
    "/:cartItemId",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.order.create),
    validateRequest(CartValidation.updateCartItem),
    CartController.updateCartItemQuantity
);

router.delete(
    "/:cartItemId",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.order.create),
    CartController.removeCartItem
);

export const cartRoutes = router;

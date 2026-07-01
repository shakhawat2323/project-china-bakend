import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import requirePermission, { requireAnyPermission } from "../../middlewares/requirePermission";
import validateRequest from "../../middlewares/validateRequest";
import { permissions } from "../../shared/permissions";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";

const router = express.Router();

router.post(
    "/stripe/create-checkout-session",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.payment.pay),
    validateRequest(PaymentValidation.createPayment),
    PaymentController.createStripeCheckoutSession,
);

router.post(
    "/paypal/create-order",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.payment.pay),
    validateRequest(PaymentValidation.createPayment),
    PaymentController.createPayPalOrder,
);

router.post(
    "/paypal/capture-order",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.payment.pay),
    validateRequest(PaymentValidation.capturePayPalPayment),
    PaymentController.capturePayPalOrder,
);

router.get(
    "/history",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.payment.readOwn),
    PaymentController.getMyPaymentHistory,
);

router.get(
    "/transactions",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.payment.readAll),
    PaymentController.getTransactions,
);

router.get(
    "/:paymentId/receipt",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.payment.downloadReceipt, permissions.payment.readAll),
    validateRequest(PaymentValidation.paymentIdParam),
    PaymentController.getReceipt,
);

router.post(
    "/:paymentId/refund",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.payment.refund),
    validateRequest(PaymentValidation.paymentIdParam),
    PaymentController.processRefund,
);

export const paymentRoutes = router;

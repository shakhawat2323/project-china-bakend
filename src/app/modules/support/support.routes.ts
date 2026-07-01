import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import requirePermission, { requireAnyPermission } from "../../middlewares/requirePermission";
import validateRequest from "../../middlewares/validateRequest";
import { permissions } from "../../shared/permissions";
import { SupportController } from "./support.controller";
import { SupportValidation } from "./support.validation";

const router = express.Router();

router.post(
    "/tickets",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.support.createTicket),
    validateRequest(SupportValidation.createTicket),
    SupportController.createTicket,
);

router.get(
    "/tickets/my",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.support.replyOwnTicket),
    SupportController.getMyTickets,
);

router.get(
    "/tickets",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.support.manageTickets),
    SupportController.getAllTickets,
);

router.get(
    "/tickets/:ticketId",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.replyOwnTicket, permissions.support.manageTickets),
    validateRequest(SupportValidation.ticketIdParam),
    SupportController.getTicketById,
);

router.post(
    "/tickets/:ticketId/replies",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.replyOwnTicket, permissions.support.manageTickets),
    validateRequest(SupportValidation.replyTicket),
    SupportController.replyTicket,
);

router.patch(
    "/tickets/:ticketId/close",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.closeOwnTicket, permissions.support.manageTickets),
    validateRequest(SupportValidation.ticketIdParam),
    SupportController.closeTicket,
);

export const supportRoutes = router;

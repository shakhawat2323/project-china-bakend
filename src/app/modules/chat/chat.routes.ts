import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { requireAnyPermission } from "../../middlewares/requirePermission";
import validateRequest from "../../middlewares/validateRequest";
import { permissions } from "../../shared/permissions";
import { ChatController } from "./chat.controller";
import { ChatValidation } from "./chat.validation";

const router = express.Router();

router.post(
    "/rooms",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.createTicket, permissions.support.manageLiveChat),
    validateRequest(ChatValidation.createRoom),
    ChatController.createRoom,
);

router.get(
    "/rooms",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.replyOwnTicket, permissions.support.manageLiveChat),
    ChatController.getMyRooms,
);

router.get(
    "/rooms/:roomId",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.replyOwnTicket, permissions.support.manageLiveChat),
    validateRequest(ChatValidation.roomIdParam),
    ChatController.getRoomById,
);

router.post(
    "/rooms/:roomId/messages",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.replyOwnTicket, permissions.support.manageLiveChat),
    validateRequest(ChatValidation.sendMessage),
    ChatController.sendMessage,
);

router.patch(
    "/rooms/:roomId/seen",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.replyOwnTicket, permissions.support.manageLiveChat),
    validateRequest(ChatValidation.roomIdParam),
    ChatController.markSeen,
);

router.patch(
    "/rooms/:roomId/close",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.support.closeOwnTicket, permissions.support.manageLiveChat),
    validateRequest(ChatValidation.roomIdParam),
    ChatController.closeRoom,
);

export const chatRoutes = router;

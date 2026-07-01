import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ChatService } from "./chat.service";

type AuthRequest = Request & {
    user?: {
        id?: string;
        userId?: string;
        role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
    };
};

const getActor = (req: AuthRequest) => ({
    id: String(req.user?.id || req.user?.userId),
    role: req.user?.role || "CUSTOMER",
});

const createRoom = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ChatService.createRoom(getActor(req), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Chat room created successfully.",
        data: result,
    });
});

const getMyRooms = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ChatService.getMyRooms(getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Chat rooms fetched successfully.",
        data: result,
    });
});

const getRoomById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ChatService.getRoomById(String(req.params.roomId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Chat room fetched successfully.",
        data: result,
    });
});

const sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ChatService.sendMessage(String(req.params.roomId), getActor(req), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Message sent successfully.",
        data: result,
    });
});

const markSeen = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ChatService.markSeen(String(req.params.roomId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Messages marked as seen.",
        data: result,
    });
});

const closeRoom = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ChatService.closeRoom(String(req.params.roomId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Chat room closed successfully.",
        data: result,
    });
});

export const ChatController = {
    createRoom,
    getMyRooms,
    getRoomById,
    sendMessage,
    markSeen,
    closeRoom,
};

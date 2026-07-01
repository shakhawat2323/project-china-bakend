import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { NotificationService } from "./notification.service";

type AuthRequest = Request & {
    user?: {
        id?: string;
        userId?: string;
    };
};

const getUserId = (req: AuthRequest) => String(req.user?.id || req.user?.userId);

const getMyNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await NotificationService.getMyNotifications(getUserId(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notifications fetched successfully.",
        data: result,
    });
});

const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await NotificationService.markAsRead(getUserId(req), String(req.params.notificationId));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Notification marked as read.",
        data: result,
    });
});

const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await NotificationService.markAllAsRead(getUserId(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All notifications marked as read.",
        data: result,
    });
});

const broadcast = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.broadcast(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Broadcast notifications sent successfully.",
        data: result,
    });
});

export const NotificationController = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    broadcast,
};

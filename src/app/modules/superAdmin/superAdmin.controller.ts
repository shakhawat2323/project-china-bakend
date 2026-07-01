import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SuperAdminService } from "./superAdmin.service";

const getOverview = catchAsync(async (_req: Request, res: Response) => {
    const result = await SuperAdminService.getOverview();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Super Admin overview fetched successfully.",
        data: result,
    });
});

const getSettings = catchAsync(async (req: Request, res: Response) => {
    const result = await SuperAdminService.getSettings(req.query.group ? String(req.query.group) : undefined);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "System settings fetched successfully.",
        data: result,
    });
});

const upsertSetting = catchAsync(async (req: Request & { user?: { id?: string; userId?: string } }, res: Response) => {
    const result = await SuperAdminService.upsertSetting({
        ...req.body,
        updatedBy: req.user?.id || req.user?.userId,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "System setting saved successfully.",
        data: result,
    });
});

const getAuditLogs = catchAsync(async (_req: Request, res: Response) => {
    const result = await SuperAdminService.getAuditLogs();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Audit logs fetched successfully.",
        data: result,
    });
});

const getSecurityCenter = catchAsync(async (_req: Request, res: Response) => {
    const result = await SuperAdminService.getSecurityCenter();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Security center fetched successfully.",
        data: result,
    });
});

const getMonitoring = catchAsync(async (_req: Request, res: Response) => {
    const result = await SuperAdminService.getMonitoring();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Monitoring data fetched successfully.",
        data: result,
    });
});

export const SuperAdminController = {
    getOverview,
    getSettings,
    upsertSetting,
    getAuditLogs,
    getSecurityCenter,
    getMonitoring,
};

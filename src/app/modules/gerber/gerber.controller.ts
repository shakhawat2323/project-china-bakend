import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { GerberService } from "./gerber.service";

type AuthRequest = Request & {
    user?: {
        id?: string;
        userId?: string;
        role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
    };
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
};

const getActor = (req: AuthRequest) => ({
    id: String(req.user?.id || req.user?.userId),
    role: req.user?.role || "CUSTOMER",
});

const uploadFiles = catchAsync(async (req: AuthRequest, res: Response) => {
    const uploadedFiles = Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
    const result = await GerberService.uploadFiles(getActor(req), uploadedFiles, req.body.quoteId);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Files uploaded successfully.",
        data: result,
    });
});

const getMyFiles = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await GerberService.getMyFiles(getActor(req).id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Gerber files fetched successfully.",
        data: result,
    });
});

const getAllFiles = catchAsync(async (req: Request, res: Response) => {
    const result = await GerberService.getAllFiles();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All Gerber files fetched successfully.",
        data: result,
    });
});

const getFileById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await GerberService.getFileById(String(req.params.gerberId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Gerber file fetched successfully.",
        data: result,
    });
});

const reviewFile = catchAsync(async (req: Request, res: Response) => {
    const result = await GerberService.reviewFile(String(req.params.gerberId), req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Gerber review updated successfully.",
        data: result,
    });
});

const deleteOwnFile = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await GerberService.deleteOwnFile(String(req.params.gerberId), getActor(req).id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Gerber file deleted successfully.",
        data: result,
    });
});

export const GerberController = {
    uploadFiles,
    getMyFiles,
    getAllFiles,
    getFileById,
    reviewFile,
    deleteOwnFile,
};

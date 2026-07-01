import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { RbacService } from "./rbac.service";

const getPermissionSummary = catchAsync(async (req: Request, res: Response) => {
    const result = RbacService.getPermissionSummary();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Permission summary fetched successfully.",
        data: result,
    });
});

const getRoles = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.getRoles();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Roles fetched successfully.",
        data: result,
    });
});

const createRole = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.createRole(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Role created successfully.",
        data: result,
    });
});

const updateRole = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.updateRole(String(req.params.id), req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Role updated successfully.",
        data: result,
    });
});

const deleteRole = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.deleteRole(String(req.params.id));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Role deleted successfully.",
        data: result,
    });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.createAdmin(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Admin created successfully.",
        data: result,
    });
});

const getAdmins = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.getAdmins();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admins fetched successfully.",
        data: result,
    });
});

const suspendAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.suspendAdmin(String(req.params.userId));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin suspended successfully.",
        data: result,
    });
});

const activateAdmin = catchAsync(async (req: Request, res: Response) => {
    const result = await RbacService.activateAdmin(String(req.params.userId));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin activated successfully.",
        data: result,
    });
});

const assignRoleToUser = catchAsync(async (req: Request & { user?: { id?: string; userId?: string } }, res: Response) => {
    const result = await RbacService.assignRoleToUser({
        ...req.body,
        assignedBy: req.user?.id || req.user?.userId,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Role assigned successfully.",
        data: result,
    });
});

export const RbacController = {
    getPermissionSummary,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    createAdmin,
    getAdmins,
    suspendAdmin,
    activateAdmin,
    assignRoleToUser,
};

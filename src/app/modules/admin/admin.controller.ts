import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getOverview = catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminService.getOverview();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin overview fetched successfully.",
        data: result,
    });
});

const getCustomers = catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminService.getCustomers();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Customers fetched successfully.",
        data: result,
    });
});

const updateCustomerStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.updateCustomerStatus(String(req.params.userId), req.body.status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Customer status updated successfully.",
        data: result,
    });
});

const getInventory = catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminService.getInventory();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Inventory fetched successfully.",
        data: result,
    });
});

const getCategories = catchAsync(async (_req: Request, res: Response) => {
    const result = await AdminService.getCategories();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Categories fetched successfully.",
        data: result,
    });
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.createCategory(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Category created successfully.",
        data: result,
    });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.updateCategory(String(req.params.id), req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category updated successfully.",
        data: result,
    });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminService.deleteCategory(String(req.params.id));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Category deleted successfully.",
        data: result,
    });
});

export const AdminController = {
    getOverview,
    getCustomers,
    updateCustomerStatus,
    getInventory,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};

import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { OrderService } from "./order.service";

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await OrderService.createOrderFromCart(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order created successfully",
        data: result,
    });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await OrderService.getMyOrders(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders fetched successfully",
        data: result,
    });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const orderId = req.params.id as string;

    const result = await OrderService.getOrderById(userId, orderId, role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order fetched successfully",
        data: result,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.updateOrderStatus(req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const result = await OrderService.cancelOrder(userId, req.params.id as string, role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order cancelled successfully",
        data: result,
    });
});

export const OrderController = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};

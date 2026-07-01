import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CartService } from "./cart.service";

const addToCart = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id; // User must be authenticated
    const result = await CartService.addToCart(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Item added to cart successfully",
        data: result,
    });
});

const getMyCart = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await CartService.getMyCart(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart fetched successfully",
        data: result,
    });
});

const updateCartItemQuantity = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const cartItemId = req.params.cartItemId as string;
    const { quantity } = req.body;

    const result = await CartService.updateCartItemQuantity(userId, cartItemId, quantity);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Cart item quantity updated successfully",
        data: result,
    });
});

const removeCartItem = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const cartItemId = req.params.cartItemId as string;

    const result = await CartService.removeCartItem(userId, cartItemId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Item removed from cart successfully",
        data: result,
    });
});

export const CartController = {
    addToCart,
    getMyCart,
    updateCartItemQuantity,
    removeCartItem,
};

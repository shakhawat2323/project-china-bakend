import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ReviewService } from "./review.service";

type AuthRequest = Request & { user?: { id?: string; userId?: string; role?: UserRole } };

const getUserId = (req: AuthRequest) => String(req.user?.id || req.user?.userId);
const getUserRole = (req: AuthRequest) => req.user?.role || UserRole.CUSTOMER;

const createReview = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ReviewService.createReview(getUserId(req), getUserRole(req), String(req.params.productId), req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review created successfully.",
        data: result,
    });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
    const result = await ReviewService.getProductReviews(String(req.params.productId));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product reviews fetched successfully.",
        data: result,
    });
});

const getAllReviews = catchAsync(async (_req: Request, res: Response) => {
    const result = await ReviewService.getAllReviews();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Reviews fetched successfully.",
        data: result,
    });
});

const updateReview = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ReviewService.updateReview(getUserId(req), getUserRole(req), String(req.params.id), req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review updated successfully.",
        data: result,
    });
});

const deleteReview = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ReviewService.deleteReview(getUserId(req), getUserRole(req), String(req.params.id));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review deleted successfully.",
        data: result,
    });
});

const canReviewProduct = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await ReviewService.canReviewProduct(getUserId(req), String(req.params.productId), getUserRole(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review eligibility fetched successfully.",
        data: result,
    });
});

export const ReviewController = {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReview,
    deleteReview,
    canReviewProduct,
};

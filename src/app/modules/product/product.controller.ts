import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ProductService } from "./product.service";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.createProduct(req.body, req.files);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Product created successfully",
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const filters = {
        category: req.query.category,
        searchTerm: req.query.searchTerm,
    };
    
    const result = await ProductService.getAllProducts(filters);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Products fetched successfully",
        data: result,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.getProductById(req.params.id as string);

    if (!result) {
        sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Product not found",
            data: null,
        });
        return;
    }

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product fetched successfully",
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.updateProduct(req.params.id as string, req.body, req.files);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product updated successfully",
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const result = await ProductService.deleteProduct(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product deleted successfully",
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};

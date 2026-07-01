import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { QuoteService } from "./quote.service";

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

const createQuote = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await QuoteService.createQuote(getActor(req).id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Quote generated successfully.",
        data: result,
    });
});

const getMyQuotes = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await QuoteService.getMyQuotes(getActor(req).id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Quotes fetched successfully.",
        data: result,
    });
});

const getAllQuotes = catchAsync(async (req: Request, res: Response) => {
    const result = await QuoteService.getAllQuotes();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All quotes fetched successfully.",
        data: result,
    });
});

const getQuoteById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await QuoteService.getQuoteById(String(req.params.quoteId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Quote fetched successfully.",
        data: result,
    });
});

const convertQuoteToOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await QuoteService.convertQuoteToOrder(String(req.params.quoteId), getActor(req).id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Quote converted to order successfully.",
        data: result,
    });
});

export const QuoteController = {
    createQuote,
    getMyQuotes,
    getAllQuotes,
    getQuoteById,
    convertQuoteToOrder,
};

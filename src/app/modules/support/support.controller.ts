import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SupportService } from "./support.service";

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

const createTicket = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await SupportService.createTicket(getActor(req).id, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Ticket created successfully.",
        data: result,
    });
});

const getMyTickets = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await SupportService.getMyTickets(getActor(req).id);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Tickets fetched successfully.",
        data: result,
    });
});

const getAllTickets = catchAsync(async (req: Request, res: Response) => {
    const result = await SupportService.getAllTickets();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All tickets fetched successfully.",
        data: result,
    });
});

const getTicketById = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await SupportService.getTicketById(String(req.params.ticketId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Ticket fetched successfully.",
        data: result,
    });
});

const replyTicket = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await SupportService.replyTicket(String(req.params.ticketId), getActor(req), req.body.message);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Ticket reply sent successfully.",
        data: result,
    });
});

const closeTicket = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await SupportService.closeTicket(String(req.params.ticketId), getActor(req));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Ticket closed successfully.",
        data: result,
    });
});

export const SupportController = {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketById,
    replyTicket,
    closeTicket,
};

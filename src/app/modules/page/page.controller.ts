import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { PageService } from "./page.service";

const createPage = catchAsync(async (req: Request, res: Response) => {
    const result = await PageService.createPage(req.body);
    sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Page created!", data: result });
});

const getAllPages = catchAsync(async (req: Request, res: Response) => {
    const result = await PageService.getAllPages({
        sectionSlug: req.query.sectionSlug as string,
        status: req.query.status as string,
    });
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Pages fetched!", data: result });
});

const getPageBySlug = catchAsync(async (req: Request, res: Response) => {
    const result = await PageService.getPageBySlug(req.params.sectionSlug as string, req.params.pageSlug as string);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Page fetched!", data: result });
});

const updatePage = catchAsync(async (req: Request, res: Response) => {
    const result = await PageService.updatePage(req.params.id as string, req.body);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Page updated!", data: result });
});

const deletePage = catchAsync(async (req: Request, res: Response) => {
    const result = await PageService.deletePage(req.params.id as string);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Page deleted!", data: result });
});

export const PageController = { createPage, getAllPages, getPageBySlug, updatePage, deletePage };

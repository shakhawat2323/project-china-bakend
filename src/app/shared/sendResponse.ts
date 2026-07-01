import { Response } from "express";

const sendResponse = <T>(res: Response, jsonData: {
    statusCode: number;
    success: boolean;
    message: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
    };
    data: T | null | undefined;
}) => {
    const responsePayload: any = {
        success: jsonData.success,
        message: jsonData.message,
    };

    if (jsonData.meta !== undefined && jsonData.meta !== null) {
        responsePayload.meta = jsonData.meta;
    }

    responsePayload.data = jsonData.data ?? null;

    res.status(jsonData.statusCode).json(responsePayload);
};

export default sendResponse;

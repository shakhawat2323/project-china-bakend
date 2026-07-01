import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

const prismaKnownErrorMap: Record<
    string,
    { message: string; statusCode: number }
> = {
    P1000: { message: "Authentication failed against database server", statusCode: httpStatus.BAD_GATEWAY },
    P1001: { message: "Database server is unreachable", statusCode: httpStatus.SERVICE_UNAVAILABLE },
    P1002: { message: "Database server connection timed out", statusCode: httpStatus.GATEWAY_TIMEOUT },
    P2000: { message: "Input value is too long for this field", statusCode: httpStatus.BAD_REQUEST },
    P2001: { message: "Requested record does not exist", statusCode: httpStatus.NOT_FOUND },
    P2002: { message: "Duplicate key error", statusCode: httpStatus.CONFLICT },
    P2003: { message: "Foreign key constraint failed", statusCode: httpStatus.BAD_REQUEST },
    P2011: { message: "Null constraint violation", statusCode: httpStatus.BAD_REQUEST },
    P2012: { message: "Required field is missing", statusCode: httpStatus.BAD_REQUEST },
    P2014: { message: "Invalid relation reference", statusCode: httpStatus.BAD_REQUEST },
    P2015: { message: "Related record could not be found", statusCode: httpStatus.NOT_FOUND },
    P2016: { message: "Query interpretation error", statusCode: httpStatus.BAD_REQUEST },
    P2018: { message: "Required connected records were not found", statusCode: httpStatus.NOT_FOUND },
    P2020: { message: "Value is out of range for the field type", statusCode: httpStatus.BAD_REQUEST },
    P2021: { message: "Requested table does not exist", statusCode: httpStatus.INTERNAL_SERVER_ERROR },
    P2022: { message: "Requested column does not exist", statusCode: httpStatus.INTERNAL_SERVER_ERROR },
    P2025: { message: "Required record was not found", statusCode: httpStatus.NOT_FOUND },
    P2028: { message: "Transaction API error occurred", statusCode: httpStatus.CONFLICT },
    P2034: { message: "Transaction failed due to write conflict or deadlock", statusCode: httpStatus.CONFLICT },
};

import { ZodError } from "zod";
import ApiError from "../errors/ApiError";

const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode: number = 500;
    let message = "Something went wrong!";
    let errorType = "UNKNOWN_SERVER_ERROR";
    let errorSources: { path: string | number; message: string }[] = [
        {
            path: "",
            message: "Something went wrong!"
        }
    ];

    if (err instanceof ZodError) {
        statusCode = 400;
        message = "Validation Error";
        errorType = "VALIDATION_ERROR";
        errorSources = err.issues.map((issue) => {
            return {
                path: issue.path[issue.path.length - 1] as string | number,
                message: issue.message,
            };
        });
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaError = prismaKnownErrorMap[err.code];
        errorType = "DATABASE_ERROR";
        if (prismaError) {
            statusCode = prismaError.statusCode;
            message = prismaError.message;
            errorSources = [{ path: "database", message: err.message }];
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = "Database Validation Error";
        errorType = "DATABASE_VALIDATION_ERROR";
        errorSources = [{ path: "database", message: err.message }];
    } else if (err instanceof ApiError) {
        statusCode = err.statusCode || 400;
        message = err.message;
        errorType = "CUSTOM_API_ERROR";
        errorSources = [{ path: "api", message: err.message }];
    } else if (err?.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired. Please log in again.";
        errorType = "AUTHENTICATION_ERROR";
        errorSources = [{ path: "token", message: "Token Expired" }];
    } else if (err?.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid authentication token.";
        errorType = "AUTHENTICATION_ERROR";
        errorSources = [{ path: "token", message: "Invalid Token" }];
    } else if (err instanceof Error) {
        message = err.message;
        errorType = "GENERAL_SERVER_ERROR";
        errorSources = [{ path: "server", message: err.message }];
    }

    res.status(statusCode).json({
        success: false,
        errorType,
        message,
        errorSources,
        stack: process.env.NODE_ENV === "development" ? err?.stack : null
    });
};

export default globalErrorHandler;

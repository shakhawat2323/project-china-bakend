import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);


    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Registration successful!",
        data: result.user,
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body, {
        ip: req.ip,
    });

    res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 90 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Login successful!",
        data: {
            needPasswordChange: result.needPasswordChange,
            user: result.user,
        },
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Logged out successfully!",
        data: null,
    });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    const result = await AuthService.refreshToken(token, { ip: req.ip });

    res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Token refreshed!",
        data: {
            needPasswordChange: result.needPasswordChange,
        },
    });
});

const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const result = await AuthService.changePassword(req.user, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.forgotPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resetPassword(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user.id || req.user.userId;
    const result = await AuthService.getMe(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile fetched!",
        data: result,
    });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.verifyEmail(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const resendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.resendVerificationEmail(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const result = await AuthService.updateProfile(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile updated successfully!",
        data: result,
    });
});

export const AuthController = {
    register,
    login,
    logout,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    getMe,
    updateProfile
};

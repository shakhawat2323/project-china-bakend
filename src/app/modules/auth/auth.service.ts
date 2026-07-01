import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../errors/ApiError";
import { jwtHelper } from "../../helper/jwtHelper";
import { prisma } from "../../shared/prisma";
import { sendEmail } from "../../helper/emailSender";
import { Permission, rolePermissionMap } from "../../shared/permissions";

const RESET_TOKEN_EXPIRY = "5m";

// --- Helper functions ---
const getActiveUserByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    if (user.status !== "ACTIVE") {
        throw new ApiError(httpStatus.FORBIDDEN, "Account is not active!");
    }

    return user;
};

const trackUserActivity = async (userId: string, options: { ip?: string; markLogin?: boolean }) => {
    const data: any = {
        lastActivityAt: new Date(),
    };

    if (options.markLogin) {
        data.lastLoginAt = new Date();
        data.lastLoginIp = options.ip || null;
    }

    await prisma.user.update({ where: { id: userId }, data });
};

const getUserPermissions = async (userId: string, role: keyof typeof rolePermissionMap) => {
    const accessRoles = await prisma.userAccessRole.findMany({
        where: { userId, role: { isActive: true } },
        include: { role: true },
    });

    const assignedPermissions = accessRoles.flatMap((item) => item.role.permissions as Permission[]);

    return Array.from(new Set([...(rolePermissionMap[role] || []), ...assignedPermissions]));
};

// --- Service functions ---
const register = async (payload: {
    name: string;
    email: string;
    password: string;
    companyName?: string;
    phone?: string;
    address?: string;
}) => {
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email: payload.email }, { phone: payload.phone }] },
    });

    if (existingUser) {
        if (existingUser.email === payload.email) {
            throw new ApiError(httpStatus.CONFLICT, "Email already registered!");
        }
        if (existingUser.phone === payload.phone) {
            throw new ApiError(httpStatus.CONFLICT, "Phone number already registered!");
        }
    }

    const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt_round));

    const user = await prisma.user.create({
        data: {
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            companyName: payload.companyName,
            phone: payload.phone,
            address: payload.address,
            role: "CUSTOMER",
            isVerified: false,
        },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, Number(config.salt_round));

    await prisma.passwordOtp.create({
        data: {
            userId: user.id,
            otpHash: hashedOtp,
            purpose: "EMAIL_VERIFICATION",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
        },
    });

    await sendEmail(
        user.email,
        "Verify Your Email - SysPCB",
        `
        <h2>Email Verification</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>Thank you for registering. Please use the following OTP to verify your email address:</p>
        <h3 style="background:#f4f4f4;padding:10px;display:inline-block;letter-spacing:2px;">${otp}</h3>
        <p>This OTP is valid for 10 minutes.</p>
        `
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
        user: userWithoutPassword,
    };
};

const login = async (
    payload: { email: string; password: string },
    meta?: { ip?: string }
) => {
    const user = await getActiveUserByEmail(payload.email);

    const isCorrectPassword = await bcrypt.compare(payload.password, user.password);

    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect!");
    }

    if (!user.isVerified) {
        throw new ApiError(httpStatus.FORBIDDEN, "Please verify your email first!");
    }

    const accessToken = jwtHelper.generateToken(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.jwt_secret as Secret,
        (config.jwt.expires_in as string) || "1d"
    );

    const refreshToken = jwtHelper.generateToken(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.refresh_token_secret as Secret,
        (config.jwt.refresh_token_expires_in as string) || "90d"
    );

    await trackUserActivity(user.id, { ip: meta?.ip, markLogin: true });
    const permissions = await getUserPermissions(user.id, user.role);

    return {
        accessToken,
        refreshToken,
        needPasswordChange: user.needPasswordChange,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            profilePhoto: user.profilePhoto,
            permissions,
        }
    };
};

const refreshToken = async (token: string, meta?: { ip?: string }) => {
    if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required!");
    }

    let decodedData;
    try {
        decodedData = jwtHelper.verifyToken(
            token,
            config.jwt.refresh_token_secret as Secret
        );
    } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token!");
    }

    const user = await getActiveUserByEmail(decodedData.email);

    await trackUserActivity(user.id, { ip: meta?.ip });

    const accessToken = jwtHelper.generateToken(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.jwt_secret as Secret,
        (config.jwt.expires_in as string) || "1d"
    );

    return {
        accessToken,
        needPasswordChange: user.needPasswordChange,
    };
};

const changePassword = async (
    userSession: { email: string },
    payload: { oldPassword: string; newPassword: string }
) => {
    const user = await getActiveUserByEmail(userSession.email);

    const isCorrectPassword = await bcrypt.compare(payload.oldPassword, user.password);

    if (!isCorrectPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Old password is incorrect!");
    }

    const isSamePassword = await bcrypt.compare(payload.newPassword, user.password);

    if (isSamePassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New password must be different from old password!");
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, Number(config.salt_round));

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            needPasswordChange: false,
        },
    });

    return { message: "Password changed successfully!" };
};

const forgotPassword = async (payload: { email: string }) => {
    const user = await getActiveUserByEmail(payload.email);

    const resetToken = jwtHelper.generateToken(
        { email: user.email, purpose: "RESET_PASSWORD" },
        config.jwt.reset_pass_secret as Secret,
        RESET_TOKEN_EXPIRY
    );

    const resetLink = `${config.frontend_url}/reset-password?token=${resetToken}`;

    await sendEmail(
        user.email,
        "Reset Your Password - SysPCB",
        `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>Click the link below to reset your password. This link expires in 5 minutes.</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
        `
    );

    return { message: "Password reset link sent to your email!" };
};

const resetPassword = async (payload: { resetToken: string; newPassword: string }) => {
    if (!payload.resetToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Reset token is required!");
    }

    let decodedData;
    try {
        decodedData = jwtHelper.verifyToken(
            payload.resetToken,
            config.jwt.reset_pass_secret as Secret
        );
    } catch {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired reset token!");
    }

    if (decodedData.purpose !== "RESET_PASSWORD") {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid reset token!");
    }

    const user = await getActiveUserByEmail(decodedData.email);

    const isSamePassword = await bcrypt.compare(payload.newPassword, user.password);
    if (isSamePassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New password must be different from old password!");
    }

    const hashedPassword = await bcrypt.hash(payload.newPassword, Number(config.salt_round));

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            needPasswordChange: false,
        },
    });

    return { message: "Password reset successfully!" };
};

const verifyEmail = async (payload: { email: string; otp: string }) => {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    if (user.isVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified!");
    }

    const otpRecord = await prisma.passwordOtp.findFirst({
        where: {
            userId: user.id,
            purpose: "EMAIL_VERIFICATION",
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!otpRecord) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No verification OTP found!");
    }

    if (otpRecord.expiresAt < new Date()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "OTP has expired!");
    }

    const isCorrectOtp = await bcrypt.compare(payload.otp, otpRecord.otpHash);

    if (!isCorrectOtp) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP!");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }
    });

    await prisma.passwordOtp.deleteMany({
        where: { userId: user.id, purpose: "EMAIL_VERIFICATION" }
    });

    return { message: "Email verified successfully!" };
};

const resendVerificationEmail = async (payload: { email: string }) => {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    if (user.isVerified) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Email is already verified!");
    }

    await prisma.passwordOtp.deleteMany({
        where: { userId: user.id, purpose: "EMAIL_VERIFICATION" }
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, Number(config.salt_round));

    await prisma.passwordOtp.create({
        data: {
            userId: user.id,
            otpHash: hashedOtp,
            purpose: "EMAIL_VERIFICATION",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), 
        },
    });

    await sendEmail(
        user.email,
        "Verify Your Email - SysPCB",
        `
        <h2>Email Verification</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>You requested a new verification OTP. Please use the following OTP to verify your email address:</p>
        <h3 style="background:#f4f4f4;padding:10px;display:inline-block;letter-spacing:2px;">${otp}</h3>
        <p>This OTP is valid for 10 minutes.</p>
        `
    );

    return { message: "Verification OTP sent to your email!" };
};

const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            companyName: true,
            phone: true,
            address: true,
            profilePhoto: true,
            isVerified: true,
            status: true,
            createdAt: true,
            accessRoles: {
                include: {
                    role: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
    }

    const permissions = Array.from(
        new Set([
            ...(rolePermissionMap[user.role] || []),
            ...user.accessRoles
                .filter((item) => item.role.isActive)
                .flatMap((item) => item.role.permissions as Permission[]),
        ]),
    );

    const { accessRoles, ...profile } = user;

    return {
        ...profile,
        permissions,
        accessRoles,
    };
};

const updateProfile = async (userId: string, payload: any) => {
    // Determine allowed fields to update
    const allowedUpdates = {
        name: payload.name,
        companyName: payload.companyName,
        phone: payload.phone,
        address: payload.address,
        profilePhoto: payload.profilePhoto
    };

    // Remove undefined values
    const dataToUpdate = Object.fromEntries(Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined));

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            companyName: true,
            phone: true,
            address: true,
            profilePhoto: true,
            isVerified: true,
            status: true,
        }
    });

    return updatedUser;
};

export const AuthService = {
    register,
    login,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    updateProfile,
    getMe,
};

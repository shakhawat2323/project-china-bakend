import { GerberStatus, InquiryPriority, InquiryType, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import path from "path";
import ApiError from "../../errors/ApiError";
import { fileUploader } from "../../helper/fileUploader";
import { prisma } from "../../shared/prisma";
import { NotificationService } from "../notification/notification.service";
import { sendInquiryNotification } from "../../helper/emailSender";

type Actor = {
    id: string;
    role: UserRole;
};

type PublicUploadPayload = {
    fullName?: string;
    email?: string;
    companyName?: string;
    phone?: string;
    boardType?: string;
    description?: string;
};

const allowedExtensions = [".zip", ".rar", ".7z", ".csv", ".xlsx", ".xls", ".txt", ".pdf"];

const assertAllowedFile = (file: Express.Multer.File) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only Gerber ZIP/RAR/7Z, BOM CSV/XLSX/XLS/TXT/PDF files are allowed.");
    }
};

const uploadGerberAssets = async (files: Express.Multer.File[]) => {
    if (!files?.length) {
        return [];
    }

    const uploadedFiles = [];

    for (const file of files) {
        assertAllowedFile(file);
        const uploaded = await fileUploader.uploadToCloudinary(file.path, "gerber-files");
        uploadedFiles.push({
            fileName: file.originalname,
            fileUrl: uploaded.url,
            fileSize: file.size,
        });
    }

    return uploadedFiles;
};

const uploadFiles = async (actor: Actor, files: Express.Multer.File[], quoteId?: string) => {
    if (quoteId) {
        const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
        if (!quote) {
            throw new ApiError(httpStatus.NOT_FOUND, "Quote not found.");
        }
        if (quote.userId !== actor.id && actor.role === UserRole.CUSTOMER) {
            throw new ApiError(httpStatus.FORBIDDEN, "You cannot attach files to another customer's quote.");
        }
    }

    const uploadedFiles = await uploadGerberAssets(files);
    const records = [];

    for (const file of uploadedFiles) {
        records.push(
            await prisma.gerberFile.create({
                data: {
                    userId: actor.id,
                    quoteId,
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    fileSize: file.fileSize,
                    status: GerberStatus.UPLOADED,
                },
            }),
        );
    }

    await NotificationService.createNotification({
        userId: actor.id,
        title: "Gerber files uploaded",
        message: `${records.length} file(s) uploaded successfully for engineering review.`,
        type: "SUCCESS",
        link: "/gerber-files",
    });

    return records;
};

const uploadPublicInquiry = async (files: Express.Multer.File[], payload: PublicUploadPayload) => {
    const uploadedFiles = await uploadGerberAssets(files);
    const fileNames = uploadedFiles.map((file) => `${file.fileName} (${Math.round(file.fileSize / 1024)} KB)`).join(", ");
    const description = [
        payload.description?.trim(),
        `Uploaded files: ${fileNames}`,
        "Source: Website instant quote upload",
    ]
        .filter(Boolean)
        .join("\n");

    const inquiry = await prisma.inquiry.create({
        data: {
            inquiryType: InquiryType.PCB_QUOTE,
            priority: InquiryPriority.HIGH,
            fullName: payload.fullName?.trim() || "Website Gerber Upload",
            email: payload.email?.trim() || "ft-osr@feitianpcb.com",
            companyName: payload.companyName?.trim() || undefined,
            phone: payload.phone?.trim() || undefined,
            boardType: payload.boardType?.trim() || "Gerber / BOM Upload",
            description,
            fileUrls: uploadedFiles.map((file) => file.fileUrl),
        },
    });

    try {
        await sendInquiryNotification({
            fullName: inquiry.fullName,
            email: inquiry.email,
            companyName: inquiry.companyName || undefined,
            description: inquiry.description || "",
        });
    } catch (error) {
        console.error("Failed to send inquiry email notification:", error);
    }

    return {
        inquiry,
        files: uploadedFiles,
    };
};

const getMyFiles = async (userId: string) => {
    return prisma.gerberFile.findMany({
        where: { userId },
        include: { quote: true },
        orderBy: { createdAt: "desc" },
    });
};

const getAllFiles = async () => {
    return prisma.gerberFile.findMany({
        include: {
            user: { select: { id: true, name: true, email: true, companyName: true } },
            quote: true,
        },
        orderBy: { createdAt: "desc" },
    });
};

const getFileById = async (gerberId: string, actor: Actor) => {
    const file = await prisma.gerberFile.findUnique({
        where: { id: gerberId },
        include: {
            user: { select: { id: true, name: true, email: true, companyName: true } },
            quote: true,
        },
    });

    if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, "Gerber file not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && file.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot access another customer's Gerber file.");
    }

    return file;
};

const reviewFile = async (gerberId: string, payload: { status: GerberStatus; message?: string }) => {
    const file = await prisma.gerberFile.findUnique({ where: { id: gerberId } });

    if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, "Gerber file not found.");
    }

    const updatedFile = await prisma.gerberFile.update({
        where: { id: gerberId },
        data: { status: payload.status },
    });

    await NotificationService.createNotification({
        userId: file.userId,
        title: "Gerber review updated",
        message: payload.message || `Your Gerber file ${file.fileName} is now ${payload.status}.`,
        type: payload.status === GerberStatus.APPROVED ? "SUCCESS" : payload.status === GerberStatus.REJECTED ? "ERROR" : "INFO",
        link: `/gerber-files/${file.id}`,
    });

    return updatedFile;
};

const deleteOwnFile = async (gerberId: string, userId: string) => {
    const file = await prisma.gerberFile.findUnique({ where: { id: gerberId } });

    if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, "Gerber file not found.");
    }

    if (file.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot delete another customer's Gerber file.");
    }

    return prisma.gerberFile.delete({ where: { id: gerberId } });
};

export const GerberService = {
    uploadFiles,
    uploadPublicInquiry,
    getMyFiles,
    getAllFiles,
    getFileById,
    reviewFile,
    deleteOwnFile,
};
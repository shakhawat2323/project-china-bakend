import { QuoteStatus, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { NotificationService } from "../notification/notification.service";

type QuotePayload = {
    name: string;
    width: number;
    height: number;
    quantity: number;
    layerCount: number;
    materialType: string;
    boardThickness: number;
    copperWeight: number;
    surfaceFinish: string;
    solderMaskColor: string;
    silkscreenColor: string;
};

type Actor = {
    id: string;
    role: UserRole;
};

const calculateQuotePrice = (payload: QuotePayload) => {
    const areaCm2 = (payload.width * payload.height) / 100;
    const layerMultiplier = Math.max(payload.layerCount / 2, 1);
    const materialMultiplier = payload.materialType.toLowerCase().includes("rogers")
        ? 2.4
        : payload.materialType.toLowerCase().includes("aluminum")
          ? 1.6
          : 1;
    const finishMultiplier = payload.surfaceFinish.toLowerCase().includes("enig") ? 1.25 : 1;
    const copperMultiplier = Math.max(payload.copperWeight, 1);
    const thicknessFee = payload.boardThickness > 1.6 ? 8 : 0;
    const base = 18;

    return Number(
        (base + areaCm2 * 0.08 * payload.quantity * layerMultiplier * materialMultiplier * finishMultiplier * copperMultiplier + thicknessFee).toFixed(2),
    );
};

const createQuote = async (userId: string, payload: QuotePayload) => {
    const calculatedPrice = calculateQuotePrice(payload);

    const quote = await prisma.quote.create({
        data: {
            userId,
            ...payload,
            calculatedPrice,
            status: QuoteStatus.SAVED,
        },
        include: { gerberFiles: true },
    });

    await NotificationService.createNotification({
        userId,
        title: "Quote saved",
        message: `Your quote ${quote.name} has been saved. Estimated price: $${quote.calculatedPrice}.`,
        type: "SUCCESS",
        link: `/quotes/${quote.id}`,
    });

    return quote;
};

const getMyQuotes = async (userId: string) => {
    return prisma.quote.findMany({
        where: { userId },
        include: { gerberFiles: true, orders: true },
        orderBy: { createdAt: "desc" },
    });
};

const getAllQuotes = async () => {
    return prisma.quote.findMany({
        include: {
            user: { select: { id: true, name: true, email: true, companyName: true } },
            gerberFiles: true,
            orders: true,
        },
        orderBy: { createdAt: "desc" },
    });
};

const getQuoteById = async (quoteId: string, actor: Actor) => {
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            user: { select: { id: true, name: true, email: true, companyName: true } },
            gerberFiles: true,
            orders: true,
        },
    });

    if (!quote) {
        throw new ApiError(httpStatus.NOT_FOUND, "Quote not found.");
    }

    const isPrivileged = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN;
    if (!isPrivileged && quote.userId !== actor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot access another customer's quote.");
    }

    return quote;
};

const convertQuoteToOrder = async (
    quoteId: string,
    userId: string,
    payload: { shippingAddress: string; billingAddress?: string },
) => {
    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });

    if (!quote) {
        throw new ApiError(httpStatus.NOT_FOUND, "Quote not found.");
    }

    if (quote.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You cannot convert another customer's quote.");
    }

    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId,
                quoteId: quote.id,
                totalAmount: quote.calculatedPrice,
                shippingAddress: payload.shippingAddress,
                billingAddress: payload.billingAddress || payload.shippingAddress,
            },
        });

        await tx.quote.update({
            where: { id: quote.id },
            data: { status: QuoteStatus.ORDERED },
        });

        return newOrder;
    });

    await NotificationService.createNotification({
        userId,
        title: "Quote converted to order",
        message: `Quote ${quote.name} has been converted to order ${order.id}.`,
        type: "SUCCESS",
        link: `/orders/${order.id}`,
    });

    return order;
};

export const QuoteService = {
    calculateQuotePrice,
    createQuote,
    getMyQuotes,
    getAllQuotes,
    getQuoteById,
    convertQuoteToOrder,
};

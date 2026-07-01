import { PaymentStatus, UserRole } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";

const updateProductReviewSummary = async (productId: string) => {
    const aggregate = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await prisma.product.update({
        where: { id: productId },
        data: {
            rating: Number((aggregate._avg.rating || 0).toFixed(1)),
            reviewCount: aggregate._count.rating,
        },
    });
};

const ensureCanReview = async (userId: string, productId: string, role: UserRole) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found.");
    }

    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
        return;
    }

    const purchased = await prisma.orderItem.findFirst({
        where: {
            productId,
            order: {
                userId,
                paymentStatus: PaymentStatus.PAID,
            },
        },
        select: { id: true },
    });

    if (!purchased) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can review only products you purchased and paid for.");
    }
};

const createReview = async (userId: string, role: UserRole, productId: string, payload: { rating: number; comment?: string }) => {
    await ensureCanReview(userId, productId, role);

    const existingReview = await prisma.review.findFirst({
        where: { userId, productId },
    });

    if (existingReview) {
        throw new ApiError(httpStatus.CONFLICT, "You already reviewed this product.");
    }

    const review = await prisma.review.create({
        data: {
            userId,
            productId,
            rating: payload.rating,
            comment: payload.comment,
        },
        include: {
            user: { select: { id: true, name: true, email: true, profilePhoto: true } },
            product: { select: { id: true, name: true, slug: true } },
        },
    });

    await updateProductReviewSummary(productId);
    return review;
};

const getProductReviews = async (productId: string) => {
    const [reviews, summary] = await Promise.all([
        prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { id: true, name: true, email: true, profilePhoto: true } },
            },
        }),
        prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { rating: true },
        }),
    ]);

    return {
        summary: {
            averageRating: Number((summary._avg.rating || 0).toFixed(1)),
            totalReviews: summary._count.rating,
        },
        reviews,
    };
};

const getAllReviews = async () => {
    return prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, name: true, email: true, profilePhoto: true } },
            product: { select: { id: true, name: true, slug: true } },
        },
    });
};

const updateReview = async (
    userId: string,
    role: UserRole,
    reviewId: string,
    payload: { rating?: number; comment?: string },
) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found.");
    }

    if (role === UserRole.CUSTOMER && review.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can update only your own review.");
    }

    const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: payload,
        include: {
            user: { select: { id: true, name: true, email: true, profilePhoto: true } },
            product: { select: { id: true, name: true, slug: true } },
        },
    });

    await updateProductReviewSummary(review.productId);
    return updatedReview;
};

const deleteReview = async (userId: string, role: UserRole, reviewId: string) => {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
        throw new ApiError(httpStatus.NOT_FOUND, "Review not found.");
    }

    if (role === UserRole.CUSTOMER && review.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, "You can delete only your own review.");
    }

    const deletedReview = await prisma.review.delete({ where: { id: reviewId } });
    await updateProductReviewSummary(review.productId);
    return deletedReview;
};

const canReviewProduct = async (userId: string, productId: string, role: UserRole) => {
    const existingReview = await prisma.review.findFirst({
        where: { userId, productId },
        select: { id: true },
    });

    if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
        return { canReview: true, hasPurchased: true, hasReviewed: Boolean(existingReview) };
    }

    const purchased = await prisma.orderItem.findFirst({
        where: {
            productId,
            order: {
                userId,
                paymentStatus: PaymentStatus.PAID,
            },
        },
        select: { id: true },
    });

    return {
        canReview: Boolean(purchased) && !existingReview,
        hasPurchased: Boolean(purchased),
        hasReviewed: Boolean(existingReview),
    };
};

export const ReviewService = {
    createReview,
    getProductReviews,
    getAllReviews,
    updateReview,
    deleteReview,
    canReviewProduct,
};

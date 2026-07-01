import { PaymentStatus, UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

const getOverview = async () => {
    const [orders, products, customers, payments, pendingOrders, lowStockProducts, openTickets] = await Promise.all([
        prisma.order.count(),
        prisma.product.count(),
        prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
        prisma.payment.findMany({ select: { amount: true, status: true } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.product.count({ where: { stock: { lte: 10 } } }),
        prisma.ticket.count({ where: { status: { not: "CLOSED" } } }),
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.status === PaymentStatus.PAID ? payment.amount : 0), 0);

    return {
        totalOrders: orders,
        pendingOrders,
        totalProducts: products,
        totalCustomers: customers,
        totalRevenue,
        lowStockProducts,
        openTickets,
    };
};

const getCustomers = async () => {
    return prisma.user.findMany({
        where: { role: UserRole.CUSTOMER },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            email: true,
            name: true,
            companyName: true,
            phone: true,
            status: true,
            isVerified: true,
            lastLoginAt: true,
            createdAt: true,
            _count: {
                select: { orders: true, tickets: true, reviews: true },
            },
        },
    });
};

const updateCustomerStatus = async (userId: string, status: UserStatus) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.role !== UserRole.CUSTOMER) {
        throw new ApiError(httpStatus.NOT_FOUND, "Customer not found.");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { status },
        select: { id: true, email: true, name: true, role: true, status: true },
    });
};

const getInventory = async () => {
    return prisma.product.findMany({
        orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
        select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            price: true,
            stock: true,
            status: true,
            images: true,
            updatedAt: true,
        },
    });
};

const getCategories = async () => {
    return prisma.productCategory.findMany({
        orderBy: [{ order: "asc" }, { name: "asc" }],
    });
};

const createCategory = async (payload: { name: string; slug?: string; description?: string; icon?: string; order?: number }) => {
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);

    const existing = await prisma.productCategory.findUnique({ where: { slug } });
    if (existing) {
        throw new ApiError(httpStatus.CONFLICT, "Category slug already exists.");
    }

    return prisma.productCategory.create({
        data: {
            name: payload.name,
            slug,
            description: payload.description,
            icon: payload.icon,
            order: payload.order || 0,
        },
    });
};

const updateCategory = async (id: string, payload: { name?: string; slug?: string; description?: string; icon?: string; order?: number }) => {
    const category = await prisma.productCategory.findUnique({ where: { id } });

    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
    }

    return prisma.productCategory.update({
        where: { id },
        data: {
            ...payload,
            ...(payload.slug ? { slug: slugify(payload.slug) } : {}),
        },
    });
};

const deleteCategory = async (id: string) => {
    const category = await prisma.productCategory.findUnique({ where: { id } });

    if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, "Category not found.");
    }

    return prisma.productCategory.delete({ where: { id } });
};

export const AdminService = {
    getOverview,
    getCustomers,
    updateCustomerStatus,
    getInventory,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
};

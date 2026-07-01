import { UserRole, UserStatus, PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";

const getOverview = async () => {
    const [
        totalOrders,
        totalProducts,
        totalCustomers,
        totalAdmins,
        payments,
        pendingOrders,
        deliveredOrders,
        lowStockProducts,
        recentOrders,
        recentPayments,
        orderStatusGroups,
        productStatusGroups,
    ] = await Promise.all([
        prisma.order.count(),
        prisma.product.count(),
        prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
        prisma.user.count({ where: { role: UserRole.ADMIN } }),
        prisma.payment.findMany({ select: { amount: true, status: true, method: true, createdAt: true, currency: true } }),
        prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
        prisma.product.count({ where: { stock: { lte: 10 } } }),
        prisma.order.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
                id: true,
                status: true,
                totalAmount: true,
                paymentStatus: true,
                createdAt: true,
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma.payment.findMany({
            orderBy: { createdAt: "desc" },
            take: 8,
            select: {
                id: true,
                orderId: true,
                amount: true,
                currency: true,
                method: true,
                status: true,
                createdAt: true,
            },
        }),
        prisma.order.groupBy({
            by: ["status"],
            _count: { status: true },
        }),
        prisma.product.groupBy({
            by: ["status"],
            _count: { status: true },
        }),
    ]);

    const paidPayments = payments.filter((payment) => payment.status === PaymentStatus.PAID);
    const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const monthlyRevenue = paidPayments.reduce<Record<string, number>>((acc, payment) => {
        const date = new Date(payment.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        acc[key] = (acc[key] || 0) + Number(payment.amount || 0);
        return acc;
    }, {});

    return {
        totals: {
            revenue: totalRevenue,
            orders: totalOrders,
            products: totalProducts,
            customers: totalCustomers,
            admins: totalAdmins,
            pendingOrders,
            deliveredOrders,
            lowStockProducts,
            transactions: payments.length,
        },
        monthlyRevenue: Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        paymentMethods: payments.reduce<Record<string, number>>((acc, payment) => {
            acc[payment.method] = (acc[payment.method] || 0) + 1;
            return acc;
        }, {}),
        orderStatus: orderStatusGroups.map((item) => ({ status: item.status, count: item._count.status })),
        productStatus: productStatusGroups.map((item) => ({ status: item.status, count: item._count.status })),
        recentOrders,
        recentPayments,
    };
};

const getSettings = async (group?: string) => {
    return prisma.systemSetting.findMany({
        where: group ? { group } : undefined,
        orderBy: [{ group: "asc" }, { key: "asc" }],
    });
};

const upsertSetting = async (payload: { key: string; value: unknown; group?: string; updatedBy?: string }) => {
    return prisma.systemSetting.upsert({
        where: { key: payload.key },
        update: {
            value: payload.value as object,
            group: payload.group || "GENERAL",
            updatedBy: payload.updatedBy,
        },
        create: {
            key: payload.key,
            value: payload.value as object,
            group: payload.group || "GENERAL",
            updatedBy: payload.updatedBy,
        },
    });
};

const getAuditLogs = async () => {
    return prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                },
            },
        },
    });
};

const getSecurityCenter = async () => {
    const [blockedUsers, inactiveUsers, recentLogins, failedSecurityEvents] = await Promise.all([
        prisma.user.count({ where: { status: UserStatus.BLOCKED } }),
        prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
        prisma.user.findMany({
            where: { lastLoginAt: { not: null } },
            orderBy: { lastLoginAt: "desc" },
            take: 20,
            select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, lastLoginIp: true },
        }),
        prisma.activityLog.findMany({
            where: {
                OR: [
                    { action: { contains: "FAILED" } },
                    { action: { contains: "SECURITY" } },
                    { action: { contains: "LOGIN" } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 50,
            include: { user: { select: { id: true, email: true, name: true, role: true } } },
        }),
    ]);

    return {
        summary: { blockedUsers, inactiveUsers, recentLogins: recentLogins.length, securityEvents: failedSecurityEvents.length },
        recentLogins,
        events: failedSecurityEvents,
    };
};

const getMonitoring = async () => {
    const [users, products, orders, payments, settings] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.payment.count(),
        prisma.systemSetting.count(),
    ]);

    return {
        api: { status: "UP", checkedAt: new Date().toISOString() },
        database: { status: "UP", models: { users, products, orders, payments, settings } },
        application: { status: "UP", environment: process.env.NODE_ENV || "development" },
    };
};

export const SuperAdminService = {
    getOverview,
    getSettings,
    upsertSetting,
    getAuditLogs,
    getSecurityCenter,
    getMonitoring,
};

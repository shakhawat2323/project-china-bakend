import { prisma } from "../../shared/prisma";
import { Order, OrderStatus } from "@prisma/client";
import { NotificationService } from "../notification/notification.service";
import { socketManager } from "../../shared/socket";

const createOrderFromCart = async (userId: string, payload: { shippingAddress: string; billingAddress?: string }): Promise<Order> => {
    // 1. Fetch user's cart
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: { product: true },
            },
        },
    });

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    // 2. Calculate total amount
    let totalAmount = 0;
    const orderItemsData = cart.items.map((item) => {
        const itemTotal = item.quantity * item.product.price;
        totalAmount += itemTotal;
        return {
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Record the price at the time of purchase
        };
    });

    // 3. Create the order within a transaction
    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId,
                totalAmount,
                shippingAddress: payload.shippingAddress,
                billingAddress: payload.billingAddress || payload.shippingAddress,
                orderItems: {
                    create: orderItemsData,
                },
            },
            include: {
                orderItems: true,
            },
        });

        // 4. Clear the cart
        await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return newOrder;
    });

    return order;
};

const getMyOrders = async (userId: string): Promise<Order[]> => {
    return await prisma.order.findMany({
        where: { userId },
        include: {
            orderItems: {
                include: { product: true },
            },
            payments: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};

const getOrderById = async (userId: string, orderId: string, role: string): Promise<Order | null> => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            orderItems: {
                include: { product: true },
            },
            payments: true,
        },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && order.userId !== userId) {
        throw new Error("You are not authorized to view this order");
    }

    return order;
};

const updateOrderStatus = async (orderId: string, payload: { status: OrderStatus; note?: string }) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
    });

    if (!order) {
        throw new Error("Order not found");
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: payload.status },
    });

    await NotificationService.createNotification({
        userId: order.userId,
        title: "Order status updated",
        message: payload.note || `Your order is now ${payload.status}.`,
        type: "INFO",
        link: `/orders/${order.id}`,
    });

    socketManager.emitToOrder(order.id, "order:status-updated", updatedOrder);
    socketManager.emitToUser(order.userId, "order:status-updated", updatedOrder);

    return updatedOrder;
};

const cancelOrder = async (userId: string, orderId: string, role: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
        throw new Error("Order not found");
    }

    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && order.userId !== userId) {
        throw new Error("You are not authorized to cancel this order");
    }

    if (["PRODUCTION", "QUALITY_CONTROL", "PACKAGING", "SHIPPED", "DELIVERED"].includes(order.status)) {
        throw new Error("This order can no longer be cancelled");
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
    });

    await NotificationService.createNotification({
        userId: order.userId,
        title: "Order cancelled",
        message: `Order ${order.id} has been cancelled.`,
        type: "WARNING",
        link: `/orders/${order.id}`,
    });

    socketManager.emitToOrder(order.id, "order:cancelled", updatedOrder);
    socketManager.emitToUser(order.userId, "order:cancelled", updatedOrder);

    return updatedOrder;
};

export const OrderService = {
    createOrderFromCart,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};

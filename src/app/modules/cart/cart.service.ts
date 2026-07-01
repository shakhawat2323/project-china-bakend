import { prisma } from "../../shared/prisma";
import { Cart, CartItem } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";

const addToCart = async (userId: string, payload: { productId: string; quantity?: number }): Promise<Cart> => {
    const { productId } = payload;
    const quantity = Number(payload.quantity || 1);

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be at least 1.");
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new ApiError(httpStatus.NOT_FOUND, "Product not found. Please refresh products and try again.");
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
        where: { userId },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
        });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
        where: {
            cartId_productId: {
                cartId: cart.id,
                productId,
            },
        },
    });

    if (existingItem) {
        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: {
                quantity: existingItem.quantity + quantity,
            },
        });
    } else {
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                quantity,
            },
        });
    }

    // Return updated cart
    return await prisma.cart.findUniqueOrThrow({
        where: { id: cart.id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });
};

const getMyCart = async (userId: string): Promise<Cart | null> => {
    return await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
                orderBy: { createdAt: 'desc' }
            },
        },
    });
};

const updateCartItemQuantity = async (userId: string, cartItemId: string, quantity: number): Promise<CartItem> => {
    // Verify item belongs to user's cart
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart not found");
    }

    const item = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
    });

    if (!item || item.cartId !== cart.id) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart item not found or doesn't belong to this user");
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be at least 1.");
    }

    const result = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: Number(quantity) },
        include: { product: true },
    });

    return result;
};

const removeCartItem = async (userId: string, cartItemId: string): Promise<CartItem> => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart not found");
    }

    const item = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
    });

    if (!item || item.cartId !== cart.id) {
        throw new ApiError(httpStatus.NOT_FOUND, "Cart item not found or doesn't belong to this user");
    }

    const result = await prisma.cartItem.delete({
        where: { id: cartItemId },
        include: { product: true },
    });

    return result;
};

export const CartService = {
    addToCart,
    getMyCart,
    updateCartItemQuantity,
    removeCartItem,
};

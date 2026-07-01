import { prisma } from "../../shared/prisma";
import { Product } from "@prisma/client";
import { fileUploader } from "../../helper/fileUploader";

const parseJsonValue = (value: any, fallback: any) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const toFloat = (value: any, fallback = 0) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toInt = (value: any, fallback = 0) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: any, fallback = false) => {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }

    if (typeof value === "boolean") {
        return value;
    }

    return value === "true";
};

const normalizeProductPayload = (payload: any) => {
    const data: any = { ...payload };

    if (payload.price !== undefined) data.price = toFloat(payload.price);
    if (payload.stock !== undefined) data.stock = toInt(payload.stock);
    if (payload.minOrderQty !== undefined) data.minOrderQty = toInt(payload.minOrderQty, 1);
    if (payload.leadTimeDays !== undefined) data.leadTimeDays = toInt(payload.leadTimeDays, 1);
    if (payload.rating !== undefined) data.rating = toFloat(payload.rating);
    if (payload.isFeatured !== undefined) data.isFeatured = toBoolean(payload.isFeatured);
    if (payload.tags !== undefined) data.tags = parseJsonValue(payload.tags, []);
    if (payload.specifications !== undefined) data.specifications = parseJsonValue(payload.specifications, {});
    if (payload.images !== undefined) data.images = parseJsonValue(payload.images, []);

    return data;
};

const createProduct = async (payload: any, files: any): Promise<Product> => {
    const normalizedPayload = normalizeProductPayload(payload);
    let images: string[] = Array.isArray(normalizedPayload.images) ? normalizedPayload.images : [];

    // Handle image uploads to Cloudinary
    if (files && files.length > 0) {
        for (const file of files) {
            const uploaded = await fileUploader.uploadToCloudinary(file.path, "products");
            images.push(uploaded.url);
        }
    }

    // Generate unique slug
    const slug = normalizedPayload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();

    const result = await prisma.product.create({
        data: {
            ...normalizedPayload,
            slug,
            images,
        },
    });

    return result;
};

const getAllProducts = async (filters: any) => {
    const { category, searchTerm } = filters;
    const whereConditions: any = {};

    if (category) {
        whereConditions.category = category;
    }

    if (searchTerm) {
        whereConditions.OR = [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
        ];
    }

    const result = await prisma.product.findMany({
        where: whereConditions,
        orderBy: { createdAt: "desc" },
    });

    return result;
};

const getProductById = async (id: string): Promise<Product | null> => {
    const result = await prisma.product.findUnique({
        where: { id },
    });
    return result;
};

const updateProduct = async (id: string, payload: any, files: any): Promise<Product> => {
    const normalizedPayload = normalizeProductPayload(payload);
    let newImages: string[] = Array.isArray(normalizedPayload.images) ? normalizedPayload.images : [];

    // Handle new image uploads
    if (files && files.length > 0) {
        for (const file of files) {
            const uploaded = await fileUploader.uploadToCloudinary(file.path, "products");
            newImages.push(uploaded.url);
        }
    }

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
        throw new Error("Product not found");
    }

    // Append new images to existing ones if any are uploaded
    const images = newImages.length > 0 ? [...existingProduct.images, ...newImages] : existingProduct.images;

    // Update slug if name is changed
    let slug = existingProduct.slug;
    if (normalizedPayload.name && normalizedPayload.name !== existingProduct.name) {
        slug = normalizedPayload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now();
    }

    const result = await prisma.product.update({
        where: { id },
        data: {
            ...normalizedPayload,
            slug,
            images,
        },
    });

    return result;
};

const deleteProduct = async (id: string): Promise<Product> => {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
        throw new Error("Product not found");
    }

    const result = await prisma.product.delete({
        where: { id },
    });

    return result;
};

export const ProductService = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};

import { z } from "zod";

const createProduct = z.object({
    body: z.object({
        name: z.string().trim().min(3, "Product name must be at least 3 characters").max(160, "Product name is too long"),
        category: z.string().trim().min(2, "Category is required").max(80).optional(),
        description: z.string().trim().min(20, "Description must be at least 20 characters").max(5000).optional(),
        price: z.preprocess((val) => val ? Number(val) : 0, z.number().min(0, "Price cannot be negative")).optional(),
        stock: z.preprocess((val) => val ? Number(val) : 0, z.number().min(0, "Stock cannot be negative")).optional(),
        minOrderQty: z.preprocess((val) => val ? Number(val) : 1, z.number().min(1, "Minimum order quantity must be at least 1")).optional(),
        leadTimeDays: z.preprocess((val) => val ? Number(val) : 1, z.number().min(0, "Lead time cannot be negative")).optional(),
        isFeatured: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
        status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
        rating: z.preprocess((val) => val ? Number(val) : 0, z.number().min(0).max(5)).optional(),
        tags: z.preprocess((val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return []; }
            }
            return val;
        }, z.array(z.string().trim().min(1)).max(20).optional()),
        images: z.preprocess((val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return []; }
            }
            return val;
        }, z.array(z.string()).optional()),
        specifications: z.preprocess((val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return {}; }
            }
            return val;
        }, z.any().optional()),
    }),
});

const updateProduct = z.object({
    body: z.object({
        name: z.string().trim().min(3).max(160).optional(),
        category: z.string().trim().min(2).max(80).optional(),
        description: z.string().trim().min(20).max(5000).optional(),
        price: z.preprocess((val) => val !== undefined ? Number(val) : undefined, z.number().min(0).optional()),
        stock: z.preprocess((val) => val !== undefined ? Number(val) : undefined, z.number().min(0).optional()),
        minOrderQty: z.preprocess((val) => val !== undefined ? Number(val) : undefined, z.number().min(1).optional()),
        leadTimeDays: z.preprocess((val) => val !== undefined ? Number(val) : undefined, z.number().min(0).optional()),
        isFeatured: z.preprocess((val) => val !== undefined ? (val === 'true' || val === true) : undefined, z.boolean().optional()),
        status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
        rating: z.preprocess((val) => val !== undefined ? Number(val) : undefined, z.number().min(0).max(5).optional()),
        tags: z.preprocess((val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return []; }
            }
            return val;
        }, z.array(z.string().trim().min(1)).max(20).optional()),
        specifications: z.preprocess((val) => {
            if (typeof val === 'string') {
                try { return JSON.parse(val); } catch (e) { return {}; }
            }
            return val;
        }, z.any().optional()),
    }),
});

export const ProductValidation = {
    createProduct,
    updateProduct,
};

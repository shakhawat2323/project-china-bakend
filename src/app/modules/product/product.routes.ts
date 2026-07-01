import express from "express";
import { ProductController } from "./product.controller";
import { fileUploader } from "../../helper/fileUploader";
import validateRequest from "../../middlewares/validateRequest";
import { ProductValidation } from "./product.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import requirePermission from "../../middlewares/requirePermission";
import { permissions } from "../../shared/permissions";

const router = express.Router();

// Create Product - Only Admin/SuperAdmin
router.post(
    "/",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    requirePermission(permissions.product.create),
    fileUploader.upload.array("images", 5),
    validateRequest(ProductValidation.createProduct),
    ProductController.createProduct
);

// Get All Products (Public)
router.get(
    "/",
    ProductController.getAllProducts
);

// Get Single Product by ID (Public)
router.get(
    "/:id",
    ProductController.getProductById
);

// Update Product - Only Admin/SuperAdmin
router.patch(
    "/:id",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    requirePermission(permissions.product.update),
    fileUploader.upload.array("images", 5),
    validateRequest(ProductValidation.updateProduct),
    ProductController.updateProduct
);

// Delete Product - Only Admin/SuperAdmin
router.delete(
    "/:id",
    auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
    requirePermission(permissions.product.delete),
    ProductController.deleteProduct
);

export const productRoutes = router;

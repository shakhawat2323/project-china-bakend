import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewController } from "./review.controller";
import { ReviewValidation } from "./review.validation";

const router = express.Router();

router.get("/", auth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ReviewController.getAllReviews);
router.get("/products/:productId", ReviewController.getProductReviews);
router.get("/products/:productId/can-review", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN), ReviewController.canReviewProduct);
router.post("/products/:productId", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN), validateRequest(ReviewValidation.createReview), ReviewController.createReview);
router.patch("/:id", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN), validateRequest(ReviewValidation.updateReview), ReviewController.updateReview);
router.delete("/:id", auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN), ReviewController.deleteReview);

export const reviewRoutes = router;

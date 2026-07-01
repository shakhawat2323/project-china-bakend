import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = express.Router();

router.use(auth(UserRole.ADMIN, UserRole.SUPER_ADMIN));

router.get("/overview", AdminController.getOverview);
router.get("/customers", AdminController.getCustomers);
router.patch("/customers/:userId/status", validateRequest(AdminValidation.updateCustomerStatus), AdminController.updateCustomerStatus);
router.get("/inventory", AdminController.getInventory);
router.get("/categories", AdminController.getCategories);
router.post("/categories", validateRequest(AdminValidation.createCategory), AdminController.createCategory);
router.patch("/categories/:id", validateRequest(AdminValidation.updateCategory), AdminController.updateCategory);
router.delete("/categories/:id", AdminController.deleteCategory);

export const adminRoutes = router;

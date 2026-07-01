import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { SuperAdminController } from "./superAdmin.controller";

const router = express.Router();

router.use(auth(UserRole.SUPER_ADMIN));

router.get("/overview", SuperAdminController.getOverview);
router.get("/settings", SuperAdminController.getSettings);
router.put("/settings", SuperAdminController.upsertSetting);
router.get("/audit-logs", SuperAdminController.getAuditLogs);
router.get("/security", SuperAdminController.getSecurityCenter);
router.get("/monitoring", SuperAdminController.getMonitoring);

export const superAdminRoutes = router;

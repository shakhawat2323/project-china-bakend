import express from "express";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../helper/fileUploader";
import auth from "../../middlewares/auth";
import requirePermission, { requireAnyPermission } from "../../middlewares/requirePermission";
import validateRequest from "../../middlewares/validateRequest";
import { permissions } from "../../shared/permissions";
import { GerberController } from "./gerber.controller";
import { GerberValidation } from "./gerber.validation";

const router = express.Router();

router.post(
    "/upload",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.gerber.upload),
    fileUploader.upload.array("files", 10),
    validateRequest(GerberValidation.uploadGerber),
    GerberController.uploadFiles,
);

router.get(
    "/my",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.gerber.downloadOwn),
    GerberController.getMyFiles,
);

router.get(
    "/",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.gerber.review),
    GerberController.getAllFiles,
);

router.get(
    "/:gerberId",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.gerber.downloadOwn, permissions.gerber.review),
    validateRequest(GerberValidation.gerberIdParam),
    GerberController.getFileById,
);

router.patch(
    "/:gerberId/review",
    auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requireAnyPermission(permissions.gerber.approve, permissions.gerber.reject, permissions.gerber.requestRevision),
    validateRequest(GerberValidation.reviewGerber),
    GerberController.reviewFile,
);

router.delete(
    "/:gerberId",
    auth(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
    requirePermission(permissions.gerber.deleteOwn),
    validateRequest(GerberValidation.gerberIdParam),
    GerberController.deleteOwnFile,
);

export const gerberRoutes = router;

import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import requirePermission from "../../middlewares/requirePermission";
import validateRequest from "../../middlewares/validateRequest";
import { permissions } from "../../shared/permissions";
import { RbacController } from "./rbac.controller";
import { RbacValidation } from "./rbac.validation";

const router = express.Router();

router.use(auth(UserRole.SUPER_ADMIN));

router.get(
    "/permissions",
    requirePermission(permissions.role.assignPermissions),
    RbacController.getPermissionSummary,
);

router.get(
    "/roles",
    requirePermission(permissions.role.assignPermissions),
    RbacController.getRoles,
);

router.post(
    "/roles",
    requirePermission(permissions.role.create),
    validateRequest(RbacValidation.createRole),
    RbacController.createRole,
);

router.patch(
    "/roles/:id",
    requirePermission(permissions.role.update),
    validateRequest(RbacValidation.updateRole),
    RbacController.updateRole,
);

router.delete(
    "/roles/:id",
    requirePermission(permissions.role.delete),
    RbacController.deleteRole,
);

router.get(
    "/admins",
    requirePermission(permissions.admin.update),
    RbacController.getAdmins,
);

router.post(
    "/admins",
    requirePermission(permissions.admin.create),
    validateRequest(RbacValidation.createAdmin),
    RbacController.createAdmin,
);

router.patch(
    "/admins/:userId/suspend",
    requirePermission(permissions.admin.suspend),
    validateRequest(RbacValidation.userIdParam),
    RbacController.suspendAdmin,
);

router.patch(
    "/admins/:userId/activate",
    requirePermission(permissions.admin.suspend),
    validateRequest(RbacValidation.userIdParam),
    RbacController.activateAdmin,
);

router.post(
    "/assign-role",
    requirePermission(permissions.admin.assignPermissions),
    validateRequest(RbacValidation.assignRole),
    RbacController.assignRoleToUser,
);

export const rbacRoutes = router;

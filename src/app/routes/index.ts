import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { productRoutes } from "../modules/product/product.routes";
import { cartRoutes } from "../modules/cart/cart.routes";
import { orderRoutes } from "../modules/order/order.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { rbacRoutes } from "../modules/rbac/rbac.routes";
import { quoteRoutes } from "../modules/quote/quote.routes";
import { gerberRoutes } from "../modules/gerber/gerber.routes";
import { supportRoutes } from "../modules/support/support.routes";
import { notificationRoutes } from "../modules/notification/notification.routes";
import { chatRoutes } from "../modules/chat/chat.routes";
import { superAdminRoutes } from "../modules/superAdmin/superAdmin.routes";
import { reviewRoutes } from "../modules/review/review.routes";
import { adminRoutes } from "../modules/admin/admin.routes";

const router = express.Router();

const moduleRoutes = [
    { path: "/auth", route: authRoutes },
    { path: "/products", route: productRoutes },
    { path: "/cart", route: cartRoutes },
    { path: "/orders", route: orderRoutes },
    { path: "/payments", route: paymentRoutes },
    { path: "/rbac", route: rbacRoutes },
    { path: "/quotes", route: quoteRoutes },
    { path: "/gerber-files", route: gerberRoutes },
    { path: "/support", route: supportRoutes },
    { path: "/notifications", route: notificationRoutes },
    { path: "/chat", route: chatRoutes },
    { path: "/super-admin", route: superAdminRoutes },
    { path: "/reviews", route: reviewRoutes },
    { path: "/admin", route: adminRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

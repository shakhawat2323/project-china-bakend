import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import httpStatus from "http-status";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./app/routes";
import notFound from "./app/middlewares/notFound";
import { PaymentController } from "./app/modules/payment/payment.controller";
import config from "./config";
import rateLimiter from "./app/middlewares/rateLimiter";



const app: Application = express();

// Middlewares
const allowedOrigins = [config.frontend_url, "http://localhost:3000", "https://wupingfeitian.vercel.app"].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(rateLimiter);

// Stripe requires the original raw body for webhook signature verification.
app.post(
    "/api/v1/payments/stripe/webhook",
    express.raw({ type: "application/json" }),
    PaymentController.handleStripeWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// Root route
app.get("/", (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
        success: true,
        message: "China Project (SysPCB) Backend API is running",
    });
});

// API routes
app.use("/api/v1", router);

// Error handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;

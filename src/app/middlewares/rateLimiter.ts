import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 300);

const buckets = new Map<string, { count: number; resetAt: number }>();

const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }

    bucket.count += 1;

    if (bucket.count > maxRequests) {
        return res.status(httpStatus.TOO_MANY_REQUESTS).json({
            success: false,
            message: "Too many requests. Please try again later.",
            data: null,
        });
    }

    next();
};

export default rateLimiter;

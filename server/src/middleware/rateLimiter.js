import { rateLimit } from "express-rate-limit";

function makeLimiter(limit, windowMs) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
      success: false,
      message: "Too many requests. Try again later.",
    },
  });
}

export const apiLimiter = makeLimiter(300, 60_000);
export const authLimiter = makeLimiter(20, 15 * 60_000);
export const messageLimiter = makeLimiter(60, 60_000);
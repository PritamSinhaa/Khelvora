import { rateLimit } from "express-rate-limit";

function makeLimiter(limit, windowMs, options = {}) {
  return rateLimit({
    windowMs,
    limit,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    message: {
      success: false,
      message: "Too many requests. Try again later.",
    },

    ...options,
  });
}

export const apiLimiter = makeLimiter(300, 60_000, {
  skip: (req) =>
    ["GET", "HEAD"].includes(req.method) &&
    [
      "/api/v1/health",
      "/api/v1/ready",
    ].includes(req.path),
});

export const authLimiter = makeLimiter(
  20,
  15 * 60_000,
);

export const messageLimiter = makeLimiter(
  60,
  60_000,
);
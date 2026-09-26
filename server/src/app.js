import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { corsOptions } from "./config/cors.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

import routes from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

// Assumes one trusted reverse-proxy hop in production.
// Verify this against your hosting setup.
if (env.nodeEnv === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(cors(corsOptions));

app.use(apiLimiter);
app.use(express.json({ limit: "100kb" }));

app.use("/api/v1", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;

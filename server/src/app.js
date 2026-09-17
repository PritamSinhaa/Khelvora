import express from "express";
import cors from "cors";
import helmet from "helmet";

import { corsOptions } from "./config/cors.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import routes from "./routes/index.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors(corsOptions));
app.use(apiLimiter);
app.use(express.json({ limit: "100kb" }));

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
import { createServer } from "node:http";
import mongoose from "mongoose";

import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { setupSockets } from "./sockets/index.js";
import { startJobs } from "./jobs/maintenance.js";
import { logger } from "./utils/logger.js";

const server = createServer(app);
const io = setupSockets(server);

let stopJobs = () => {};
let closing = false;

async function shutdown(code = 0) {
  if (closing) return;
  closing = true;

  stopJobs();

  const timeout = setTimeout(() => process.exit(1), 10_000);
  timeout.unref();

  io.disconnectSockets(true);

  server.close(async () => {
    await mongoose.disconnect();
    clearTimeout(timeout);
    process.exit(code);
  });

  server.closeIdleConnections();
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

server.on("error", (error) => {
  logger.error("HTTP server failed", error);
  process.exit(1);
});

try {
  await connectDatabase();

  server.listen(env.port, () => {
    logger.info(`Khelvora API: http://localhost:${env.port}`);
    stopJobs = startJobs();
  });
} catch (error) {
  logger.error("Startup failed", error);
  console.error(error.message);

  await mongoose.disconnect();
  process.exit(1);
}
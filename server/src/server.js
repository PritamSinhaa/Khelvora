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

  const timeout = setTimeout(() => {
    process.exit(1);
  }, 10_000);

  timeout.unref();

  try {
    // Also closes the attached HTTP server.
    // Transport closure allows clients to reconnect.
    await io.close();
    await mongoose.disconnect();
  } catch (error) {
    logger.error("Shutdown failed", error);
    code = 1;
  } finally {
    clearTimeout(timeout);
    process.exit(code);
  }
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

server.on("error", (error) => {
  logger.error("HTTP server failed", error);
  void shutdown(1);
});

try {
  await connectDatabase();

  server.listen(env.port, "0.0.0.0", () => {
    logger.info(
      `Khelvora API listening on port ${env.port}`,
    );

    stopJobs = startJobs();
  });
} catch (error) {
  logger.error("Startup failed", error);
  await shutdown(1);
}
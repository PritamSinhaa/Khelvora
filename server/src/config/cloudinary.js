import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("transactionAsyncLocalStorage", true);
mongoose.set("bufferCommands", false);

export async function connectDatabase() {
  await mongoose.connect(env.mongodbUri);

  const hello = await mongoose.connection.db
    .admin()
    .command({ hello: 1 });

  if (!hello.setName && hello.msg !== "isdbgrid") {
    await mongoose.disconnect();

    throw new Error(
      "Use MongoDB Atlas or a replica set: this backend requires transactions.",
    );
  }

  // Suitable for development. Manage index deployment separately at scale.
  for (const model of Object.values(mongoose.models)) {
    await model.init();
  }

  logger.info("MongoDB connected");
}

mongoose.connection.on("error", (error) => {
  logger.error("MongoDB connection error", error);
});

mongoose.connection.on("disconnected", () => {
  logger.info("MongoDB disconnected");
});
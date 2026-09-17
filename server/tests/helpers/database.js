import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-only-secret-over-32-characters-long";

export async function startTestApp() {
  const replicaSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: "7.0.14" },
  });

  process.env.MONGODB_URI =
    replicaSet.getUri("khelvora_test");

  const { default: app } = await import("../../src/app.js");

  const { connectDatabase } =
    await import("../../src/config/database.js");

  await connectDatabase();

  return {
    app,

    async close() {
      await mongoose.disconnect();
      await replicaSet.stop();
    },
  };
}
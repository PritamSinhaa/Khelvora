import { Server } from "socket.io";

import { corsOptions } from "../config/cors.js";
import socketAuth from "./socketAuth.js";
import messageHandler from "./handlers/message.handler.js";

let io;

export function setupSockets(server) {
  io = new Server(server, {
    cors: corsOptions,
    maxHttpBufferSize: 32 * 1024,
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);

    const timer = setTimeout(
      () => {
        socket.emit("auth:expired");
        socket.disconnect(true);
      },
      Math.max(1, socket.data.expiresAt - Date.now()),
    );

    timer.unref();

    socket.on("disconnect", () => clearTimeout(timer));

    messageHandler(socket);
  });

  return io;
}

export function emitUser(id, event, data) {
  io?.to(`user:${id}`).emit(event, data);
}

export function disconnectUser(id) {
  io?.in(`user:${id}`).disconnectSockets(true);
}

export async function viewersOfConversation(conversationId) {
  if (!io) return new Set();
  const sockets = await io.in(`conversation:${conversationId}`).fetchSockets();
  return new Set(sockets.map((socket) => String(socket.data.user?.id)));
}

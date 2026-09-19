import { io } from "socket.io-client";
import { API_URL, refreshData } from "./api";

export async function connectLive(token, onStatus) {
  const origin = import.meta.env.VITE_SOCKET_URL ||
    new URL(API_URL, window.location.origin).origin;

  const socket = io(origin, {
    auth: { token },
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    onStatus(true);
    refreshData();
  });
  socket.on("disconnect", () => onStatus(false));
  socket.on("connect_error", () => onStatus(false));
  socket.on("message:new", refreshData);

  return socket;
}
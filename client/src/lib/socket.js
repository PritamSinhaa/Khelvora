import { io } from "socket.io-client";
import { API_URL, refreshData, setToken } from "./api";

let activeSocket;
let watchedConversation;

export function watchConversation(id) {
  if (activeSocket?.connected && watchedConversation && watchedConversation !== id) {
    activeSocket.emit("conversation:unwatch", watchedConversation);
  }
  watchedConversation = id || null;
  if (activeSocket?.connected && watchedConversation) {
    activeSocket.emit("conversation:watch", watchedConversation);
  }
}

export async function connectLive(token, onStatus) {
  const origin = import.meta.env.VITE_SOCKET_URL ||
    new URL(API_URL, window.location.origin).origin;

  const socket = io(origin, {
    auth: { token },
    reconnectionAttempts: 5,
  });
  activeSocket = socket;
  const connected = () => {
    onStatus(true);
    refreshData();
    if (watchedConversation) socket.emit("conversation:watch", watchedConversation);
  };
  const disconnected = () => {
    onStatus(false);
  };
  const expired = () => {
    setToken();
    window.dispatchEvent(new Event("khelvora:unauthorized"));
  };
  const connectError = (error) => {
    onStatus(false);
    if (/authentication required/i.test(error?.message || "")) expired();
  };
  const dataChanged = () => refreshData();

  socket.on("connect", connected);
  socket.on("disconnect", disconnected);
  socket.on("connect_error", connectError);
  socket.on("auth:expired", expired);
  socket.on("notification:new", dataChanged);
  socket.on("message:new", dataChanged);

  socket.dispose = () => {
    socket.off("connect", connected);
    socket.off("disconnect", disconnected);
    socket.off("connect_error", connectError);
    socket.off("auth:expired", expired);
    socket.off("notification:new", dataChanged);
    socket.off("message:new", dataChanged);
    if (activeSocket === socket) activeSocket = null;
    socket.disconnect();
  };

  return socket;
}

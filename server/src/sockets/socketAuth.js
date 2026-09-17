import { verifyAccessToken } from "../services/token.service.js";

export default async function socketAuth(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    if (typeof token !== "string") {
      throw new Error("Missing token");
    }

    const { user, payload } = await verifyAccessToken(token);

    socket.data.user = user;
    socket.data.token = token;
    socket.data.expiresAt = payload.exp * 1000;

    next();
  } catch {
    next(new Error("Authentication required."));
  }
}
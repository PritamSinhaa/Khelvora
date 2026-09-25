import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../services/token.service.js";

export default async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(
    req.get("authorization") || "",
  );

  if (!match) {
    throw new AppError("Authentication required.", 401);
  }

  const { user } = await verifyAccessToken(match[1]);

  req.user = user;
  next();
}
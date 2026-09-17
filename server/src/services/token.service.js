import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import User from "../modules/users/user.model.js";
import AppError from "../utils/AppError.js";

export function signToken(user) {
  return jwt.sign(
    { ver: user.tokenVersion },
    env.jwtSecret,
    {
      subject: String(user._id),
      expiresIn: "1h",
      algorithm: "HS256",
      issuer: "khelvora",
      audience: "khelvora-client",
    },
  );
}

export async function verifyAccessToken(token) {
  let payload;

  try {
    payload = jwt.verify(token, env.jwtSecret, {
      algorithms: ["HS256"],
      issuer: "khelvora",
      audience: "khelvora-client",
    });
  } catch {
    throw new AppError("Sign in again.", 401);
  }

  if (
    !payload ||
    typeof payload.sub !== "string" ||
    !/^[a-fA-F0-9]{24}$/.test(payload.sub) ||
    !Number.isInteger(payload.ver)
  ) {
    throw new AppError("Invalid token.", 401);
  }

  const user = await User.findOne({
    _id: payload.sub,
    isActive: true,
  }).select("+tokenVersion");

  if (!user || user.tokenVersion !== payload.ver) {
    throw new AppError("Sign in again.", 401);
  }

  return { user, payload };
}
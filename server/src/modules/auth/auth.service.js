import bcrypt from "bcryptjs";
import { createPublicKey, createVerify } from "node:crypto";

import User from "../users/user.model.js";
import AppError from "../../utils/AppError.js";
import { signToken } from "../../services/token.service.js";
import { disconnectUser } from "../../sockets/index.js";
import { env } from "../../config/env.js";

const dummyHash = bcrypt.hashSync(
  "non-user-timing-placeholder",
  12,
);

let googleKeys;
let googleKeysExpireAt = 0;

async function googleSigningKey(keyId) {
  if (!env.googleClientId) {
    throw new AppError("Google sign-in is not configured.", 503);
  }

  if (!googleKeys || Date.now() >= googleKeysExpireAt) {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
    if (!response.ok) throw new AppError("Google sign-in is temporarily unavailable.", 503);
    const cacheControl = response.headers.get("cache-control") || "";
    const maxAge = Number(cacheControl.match(/max-age=(\d+)/)?.[1] || 300);
    googleKeys = await response.json();
    googleKeysExpireAt = Date.now() + Math.min(maxAge, 3600) * 1000;
  }

  const signingKey = googleKeys.keys?.find((key) => key.kid === keyId);
  if (!signingKey || signingKey.kty !== "RSA" || signingKey.alg !== "RS256") {
    googleKeys = null;
    googleKeysExpireAt = 0;
    throw new AppError("Google credential is invalid or expired.", 401);
  }
  const { kty, n, e } = signingKey;
  return createPublicKey({ key: { kty, n, e }, format: "jwk" });
}

async function verifyGoogleCredential(credential) {
  const parts = credential.split(".");
  if (parts.length !== 3) throw new AppError("Google credential is invalid.", 401);

  let header;
  let claims;
  try {
    header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    throw new AppError("Google credential is invalid.", 401);
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new AppError("Google credential is invalid.", 401);
  }

  const publicKey = await googleSigningKey(header.kid);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${parts[0]}.${parts[1]}`);
  verifier.end();
  if (!verifier.verify(publicKey, parts[2], "base64url")) {
    throw new AppError("Google credential is invalid.", 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const issuer = ["accounts.google.com", "https://accounts.google.com"];
  if (
    !issuer.includes(claims.iss) ||
    claims.aud !== env.googleClientId ||
    !claims.sub ||
    !claims.email ||
    claims.email_verified !== true ||
    !Number.isFinite(claims.exp) || claims.exp <= now ||
    (claims.nbf && claims.nbf > now + 60) ||
    (claims.iat && claims.iat > now + 60)
  ) {
    throw new AppError("Google credential is invalid or expired.", 401);
  }
  return claims;
}

export const accountView = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  city: user.city,
  state: user.state,
  postalCode: user.postalCode,
  country: user.country,
  role: user.role,
  createdAt: user.createdAt,
});

export async function register(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  let user;

  try {
    user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError("Email is already registered.", 409);
    }

    throw error;
  }

  return {
    user: accountView(user),
    accessToken: signToken(user),
    expiresIn: 3600,
  };
}

export async function login(data) {
  const user = await User.findOne({
    email: data.email,
  }).select("+passwordHash +tokenVersion");

  const valid = await bcrypt.compare(
    data.password,
    user?.passwordHash || dummyHash,
  );

  if (!user || !valid || !user.isActive) {
    throw new AppError("Invalid email or password.", 401);
  }

  return {
    user: accountView(user),
    accessToken: signToken(user),
    expiresIn: 3600,
  };
}

export async function logout(user) {
  await User.updateOne(
    { _id: user._id },
    { $inc: { tokenVersion: 1 } },
  );

  disconnectUser(user._id);

  return { message: "Signed out on all devices." };
}

export async function changePassword(user, data) {
  const record = await User.findById(user._id)
    .select("+passwordHash +tokenVersion");

  const valid = await bcrypt.compare(
    data.currentPassword,
    record.passwordHash || dummyHash,
  );

  if (!valid) {
    throw new AppError("Current password is incorrect.", 400);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  const changed = await User.updateOne(
    {
      _id: record._id,
      tokenVersion: record.tokenVersion,
    },
    {
      $set: { passwordHash },
      $inc: { tokenVersion: 1 },
    },
  );

  if (!changed.modifiedCount) {
    throw new AppError("Account changed. Sign in again.", 409);
  }

  disconnectUser(user._id);

  return { message: "Password changed. Sign in again." };
}

export async function loginWithGoogle(credential) {
  const claims = await verifyGoogleCredential(credential);
  const email = claims.email.trim().toLowerCase();
  let user = await User.findOne({ googleId: claims.sub }).select("+tokenVersion");

  if (!user) {
    try {
      user = await User.create({
        name: (claims.name || email.split("@")[0]).trim().slice(0, 60) || "Player",
        email,
        googleId: claims.sub,
        avatarUrl: claims.picture || null,
      });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.googleId) {
        user = await User.findOne({ googleId: claims.sub }).select("+tokenVersion");
      } else if (error.code === 11000 && error.keyPattern?.email) {
        throw new AppError(
          "An account already uses this email. Sign in with your password first.",
          409,
        );
      } else {
        throw error;
      }
    }
  }

  if (!user || !user.isActive) {
    throw new AppError("This account is unavailable.", 401);
  }
  return {
    user: accountView(user),
    accessToken: signToken(user),
    expiresIn: 3600,
  };
}

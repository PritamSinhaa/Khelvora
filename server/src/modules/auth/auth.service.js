import bcrypt from "bcryptjs";

import User from "../users/user.model.js";
import AppError from "../../utils/AppError.js";
import { signToken } from "../../services/token.service.js";
import { disconnectUser } from "../../sockets/index.js";

const dummyHash = bcrypt.hashSync(
  "non-user-timing-placeholder",
  12,
);

export const accountView = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  bio: user.bio,
  city: user.city,
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
    record.passwordHash,
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
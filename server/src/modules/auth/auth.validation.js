import { z } from "zod";

export const password = z.string()
  .min(10)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password cannot exceed 72 UTF-8 bytes",
  );

const email = z.email().trim().toLowerCase().max(254);

export const register = z.strictObject({
  name: z.string().trim().min(2).max(60),
  email,
  password,
});

export const login = z.strictObject({
  email,
  password: z.string().min(1).max(200),
});

export const changePassword = z.strictObject({
  currentPassword: z.string().min(1).max(200),
  newPassword: password,
});
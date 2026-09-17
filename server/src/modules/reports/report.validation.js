import { z } from "zod";
import { id, text, page } from "../../utils/validation.js";

export const create = z.strictObject({
  userId: id,
  reason: text(2000),
});

export const resolve = z.strictObject({
  status: z.enum(["resolved", "dismissed"]),
  resolution: text(2000),
});

export const list = page;
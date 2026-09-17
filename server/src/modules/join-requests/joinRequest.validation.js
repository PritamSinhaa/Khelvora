import { z } from "zod";
import { id, page } from "../../utils/validation.js";

export const create = z.strictObject({
  teamId: id,
  message: z.string().trim().max(300).default(""),
});

export const list = page.extend({
  teamId: id.optional(),
});

export const decide = z.strictObject({
  decision: z.enum(["accepted", "rejected", "cancelled"]),
});
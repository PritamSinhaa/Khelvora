import { z } from "zod";
import { id, page } from "../../utils/validation.js";

export const create = z.strictObject({
  teamId: id,
  userId: id,
});

export const list = page.extend({
  teamId: id.optional(),
});

export const decide = z.strictObject({
  decision: z.enum(["accepted", "declined", "cancelled"]),
});
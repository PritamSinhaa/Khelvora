import { z } from "zod";
import { id, page, venue, time } from "../../utils/validation.js";

export const create = z.strictObject({
  sport: id,
  startsAt: time,
  venue,
  skillPreference: z.enum(["Any", "Beginner", "Intermediate", "Advanced"]).default("Any"),
  slots: z.number().int().min(1).max(100),
});
export const list = page.extend({
  sport: id.optional(),
  skill: z.enum(["Any", "Beginner", "Intermediate", "Advanced"]).optional(),
  timeZone: z.string().min(1).max(100).default("UTC"),
});
export const decision = z.strictObject({ decision: z.enum(["accepted", "rejected"]) });

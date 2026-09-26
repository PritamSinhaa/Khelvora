import { z } from "zod";
import { id, time } from "../../utils/validation.js";

const option = z.strictObject({ startsAt: time, endsAt: time }).refine((row) => Date.parse(row.endsAt) > Date.parse(row.startsAt), "End time must follow start time.");
export const create = z.strictObject({
  matchId: id.optional(),
  teamId: id.optional(),
  closesAt: time,
  options: z.array(option).min(2).max(10),
}).refine((row) => Boolean(row.matchId) !== Boolean(row.teamId), "Provide exactly one match or team.");
export const vote = z.strictObject({ option: z.number().int().min(0).max(9), response: z.enum(["available", "unavailable", "maybe"]) });
export const close = z.strictObject({ selectedOption: z.number().int().min(0).max(9) });

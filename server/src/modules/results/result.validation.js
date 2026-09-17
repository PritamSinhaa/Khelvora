import { z } from "zod";
import { id } from "../../utils/validation.js";

export const submit = z.strictObject({
  matchId: id,
  homeScore: z.number().int().min(0).max(100000),
  awayScore: z.number().int().min(0).max(100000),
  notes: z.string().trim().max(1000).default(""),
});

export const decide = z.strictObject({
  decision: z.enum(["confirmed", "disputed"]),
});
import { z } from "zod";
import { id, schedule, page } from "../../utils/validation.js";

export const create = z.strictObject({
  fromTeam: id,
  toTeam: id,
  schedule,
}).refine(
  (value) => value.fromTeam !== value.toTeam,
  "Choose two different teams",
);

export const list = page;

export const decide = z.strictObject({
  decision: z.enum(["accepted", "declined", "cancelled"]),
});
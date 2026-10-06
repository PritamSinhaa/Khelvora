import { z } from "zod";
import { id } from "../../utils/validation.js";
import { skillLevels } from "../../constants/sports.js";

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const save = z.strictObject({
  sport: z.union([id, z.literal("__other__")]),
  sportName: z.string().trim().max(60).optional(),
  skillLevel: z.enum(skillLevels),

  positions: z.array(
    z.string().trim().min(1).max(40),
  ).max(10).default([]),

  availability: z.array(
    z.strictObject({
      day: z.number().int().min(0).max(6),
      from: clock,
      to: clock,
    }).refine(
      (slot) => slot.to > slot.from,
      "End must be after start; split overnight slots",
    ),
  ).max(28).default([]),

  timeZone: z.string().max(80).refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Invalid timezone").default("Asia/Kolkata"),
}).refine(
  (value) => value.sport !== "__other__" || Boolean(value.sportName?.trim()),
  { message: "Enter the name of your sport.", path: ["sportName"] },
);

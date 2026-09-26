import { z } from "zod";

export {
  schedule as propose,
  page as list,
} from "../../utils/validation.js";

export const decide = z.strictObject({
  decision: z.enum(["accepted", "rejected"]),
});

export const reminders = z.strictObject({
  offsetsMinutes: z.array(z.number().int().min(15).max(10080)).min(1).max(4),
}).refine((value) => new Set(value.offsetsMinutes).size === value.offsetsMinutes.length, "Reminder offsets must be unique.");

import { z } from "zod";
import { id, page } from "../../utils/validation.js";

export const leaderboard = page.extend({
  sport: id,
  city: z.string().trim().min(1).max(100).optional(),
  season: z.string().regex(/^\d{4}$/).refine((year) => Number(year) >= 2000 && Number(year) <= 2100, "Season must be a year from 2000 to 2100.").optional(),
});

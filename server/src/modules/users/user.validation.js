import { z } from "zod";
import { nonEmpty, point } from "../../utils/validation.js";

export const update = nonEmpty(
  z.strictObject({
    name: z.string().trim().min(2).max(60).optional(),
    bio: z.string().trim().max(300).optional(),
    city: z.string().trim().max(100).optional(),
    location: point.optional(),
  }),
);
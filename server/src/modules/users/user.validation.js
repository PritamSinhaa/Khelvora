import { z } from "zod";
import { nonEmpty, point, page } from "../../utils/validation.js";

export const update = nonEmpty(
  z.strictObject({
    name: z.string().trim().min(2).max(60).optional(),
    bio: z.string().trim().max(300).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
    location: point.optional(),
  }),
);

export const reverseLocation = z.strictObject({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

export const matchHistory = page;

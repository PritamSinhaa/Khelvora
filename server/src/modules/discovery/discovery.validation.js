import { z } from "zod";

import { id, page } from "../../utils/validation.js";

import { skillLevels } from "../../constants/sports.js";

export const list = page
  .extend({
    longitude: z.coerce.number().min(-180).max(180).optional(),

    latitude: z.coerce.number().min(-90).max(90).optional(),

    radiusKm: z.coerce.number().min(1).max(100).default(10),

    sport: id.optional(),

    q: z.string().trim().max(80).optional(),

    skillLevel: z.enum(skillLevels).optional(),

    recruiting: z.enum(["true", "false"]).optional(),
  })
  .refine(
    (value) =>
      (value.longitude === undefined) === (value.latitude === undefined),
    "Provide both longitude and latitude",
  );

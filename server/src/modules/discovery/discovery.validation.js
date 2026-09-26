import { z } from "zod";

import { id, page } from "../../utils/validation.js";

import { skillLevels } from "../../constants/sports.js";

const discoveryPage = page.extend({
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export const list = discoveryPage
  .extend({
    longitude: z.coerce.number().min(-180).max(180).optional(),

    latitude: z.coerce.number().min(-90).max(90).optional(),

    radiusKm: z.coerce.number().min(1).max(100).optional(),

    sort: z.enum(["distance", "recommended"]).default("distance"),

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

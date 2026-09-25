import { z } from "zod";
import { id, point, nonEmpty, text, page } from "../../utils/validation.js";
import { skillLevels } from "../../constants/sports.js";

export const create = z.strictObject({
  name: text(80),
  sport: id,
  bio: z.string().trim().max(1000).default(""),
  city: text(100),
  location: point,
  skillLevel: z.enum(skillLevels),
  lookingForPlayers: z.boolean().default(true),
  maxMembers: z.number().int().min(2).max(100).default(30),
});

export const update = nonEmpty(
  z.strictObject({
    name: text(80).optional(),

    bio: z.string().trim().max(1000).optional(),

    city: text(100).optional(),

    location: point.optional(),

    skillLevel: z.enum(skillLevels).optional(),

    lookingForPlayers: z.boolean().optional(),

    maxMembers: z.number().int().min(2).max(100).optional(),
  }),
);

export const list = page.extend({
  sport: id.optional(),
  q: z.string().trim().max(80).optional(),
});

export const transfer = z.strictObject({
  userId: id,
});

export const cover = z.strictObject({
  uploadId: id,
});
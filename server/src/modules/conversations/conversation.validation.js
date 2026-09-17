import { z } from "zod";
import { id, page } from "../../utils/validation.js";

export const create = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("direct"),
    userId: id,
  }),

  z.strictObject({
    kind: z.literal("team-inquiry"),
    teamId: id,
  }),
]);

export const list = page;
import { z } from "zod";
import { id } from "../../utils/validation.js";

export const save = z.strictObject({
  matchId: id,
  response: z.enum(["yes", "no", "maybe"]),
});
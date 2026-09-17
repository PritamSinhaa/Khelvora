import { z } from "zod";

export {
  schedule as propose,
  page as list,
} from "../../utils/validation.js";

export const decide = z.strictObject({
  decision: z.enum(["accepted", "rejected"]),
});
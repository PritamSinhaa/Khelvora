import { z } from "zod";
import { page } from "../../utils/validation.js";

export const list = page.extend({ unread: z.enum(["true", "false"]).default("false").transform((value) => value === "true") });

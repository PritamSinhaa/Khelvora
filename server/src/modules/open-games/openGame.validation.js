import { z } from "zod";
import {
  id,
  text,
  schedule,
  page,
} from "../../utils/validation.js";

export const create = z.strictObject({
  sport: id,
  title: text(100),
  capacity: z.number().int().min(2).max(100),
  schedule,
});

export const list = page.extend({
  sport: id.optional(),
});
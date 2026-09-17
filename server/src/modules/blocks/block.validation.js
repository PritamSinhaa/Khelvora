import { z } from "zod";
import { id, page } from "../../utils/validation.js";

export const create = z.strictObject({
  userId: id,
});

export const list = page;
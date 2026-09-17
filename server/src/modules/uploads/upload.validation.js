import { z } from "zod";
import { id } from "../../utils/validation.js";

export const useAvatar = z.strictObject({
  uploadId: id,
});
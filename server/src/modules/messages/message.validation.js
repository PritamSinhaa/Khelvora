import { z } from "zod";
import { id, text, page } from "../../utils/validation.js";

export const send = z.strictObject({
  conversationId: id,
  text: text(2000),
  clientId: z.uuid(),
});

export const list = page.extend({
  conversationId: id,
});
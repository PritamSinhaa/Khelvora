import { send as sendSchema } from "../../modules/messages/message.validation.js";

import { send } from "../../modules/messages/message.service.js";

import { verifyAccessToken } from "../../services/token.service.js";

export default function messageHandler(socket) {
  let count = 0;
  let windowStart = Date.now();

  socket.on("message:send", async (data, acknowledge) => {
    if (typeof acknowledge !== "function") return;

    if (Date.now() - windowStart > 60_000) {
      count = 0;
      windowStart = Date.now();
    }

    if (++count > 60) {
      return acknowledge({
        success: false,
        message: "Too many messages.",
      });
    }

    const parsed = sendSchema.safeParse(data);

    if (!parsed.success) {
      return acknowledge({
        success: false,
        message: "Invalid message.",
      });
    }

    try {
      const { user } = await verifyAccessToken(socket.data.token);

      const message = await send(user, parsed.data);

      acknowledge({
        success: true,
        data: message,
      });
    } catch (error) {
      acknowledge({
        success: false,
        message:
          error.statusCode < 500 ? error.message : "Unable to send message.",
      });
    }
  });
}

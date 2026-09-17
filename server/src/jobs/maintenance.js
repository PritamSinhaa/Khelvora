import Invitation from "../modules/invitations/invitation.model.js";
import Challenge from "../modules/challenges/challenge.model.js";
import Notification from "../modules/notifications/notification.model.js";

import { emitUser } from "../sockets/index.js";
import { logger } from "../utils/logger.js";

export function startJobs() {
  let running = false;

  const timer = setInterval(async () => {
    if (running) return;
    running = true;

    try {
      const now = new Date();

      await Invitation.updateMany(
        {
          status: "pending",
          expiresAt: { $lte: now },
        },
        { $set: { status: "expired" } },
      );

      await Challenge.updateMany(
        {
          status: "pending",
          startsAt: { $lte: now },
        },
        { $set: { status: "expired" } },
      );

      const pending = await Notification.find({
        emittedAt: null,
      })
        .sort({ _id: 1 })
        .limit(100);

      for (const notification of pending) {
        emitUser(
          notification.user,
          "notification:new",
          notification.toJSON(),
        );

        await Notification.updateOne(
          {
            _id: notification._id,
            emittedAt: null,
          },
          { $set: { emittedAt: now } },
        );
      }
    } catch (error) {
      logger.error("Maintenance failed", error);
    } finally {
      running = false;
    }
  }, 2000);

  timer.unref();

  return () => clearInterval(timer);
}
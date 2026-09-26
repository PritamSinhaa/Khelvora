import Invitation from "../modules/invitations/invitation.model.js";
import Challenge from "../modules/challenges/challenge.model.js";
import Notification from "../modules/notifications/notification.model.js";
import { deliverDueReminders } from "../modules/matches/reminder.service.js";
import { AvailabilityPoll } from "../modules/matches/availabilityPoll.model.js";
import { processExpiredOffers } from "../modules/open-games/waitlist.service.js";

import { emitUser } from "../sockets/index.js";
import { logger } from "../utils/logger.js";

export function startJobs() {
  let running = false;

  const timer = setInterval(async () => {
    if (running) return;
    running = true;

    try {
      const now = new Date();

      await deliverDueReminders(now);
      await AvailabilityPoll.updateMany({ status: "open", closesAt: { $lte: now } }, { $set: { status: "closed" } });
      await processExpiredOffers(now);

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
        const claimed = await Notification.findOneAndUpdate(
          {
            _id: notification._id,
            emittedAt: null,
          },
          { $set: { emittedAt: now } },
          { new: true },
        );
        if (claimed) emitUser(claimed.user, "notification:new", claimed.toJSON());
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

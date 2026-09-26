import Membership from "../memberships/membership.model.js";
import Match from "./match.model.js";
import MatchReminder from "./matchReminder.model.js";
import { notify } from "../notifications/notification.service.js";
import { tx } from "../../services/access.service.js";

export async function replaceReminders(match) {
  await MatchReminder.updateMany({ match: match._id, status: "pending" }, { $set: { status: "cancelled" } });
  if (match.status !== "scheduled") return;
  const users = await Membership.find({ team: { $in: [match.homeTeam, match.awayTeam] } }).distinct("user");
  const now = new Date();
  const records = [];
  for (const user of users) {
    for (const offsetMinutes of match.reminderOffsetsMinutes || [1440, 60]) {
      const scheduledFor = new Date(new Date(match.startsAt).getTime() - offsetMinutes * 60000);
      if (scheduledFor > now) records.push({ match: match._id, user, offsetMinutes, reminderRevision: match.reminderRevision, scheduledFor });
    }
  }
  if (records.length) await MatchReminder.insertMany(records, { ordered: false });
}

export async function cancelReminders(matchId) {
  await MatchReminder.updateMany({ match: matchId, status: "pending" }, { $set: { status: "cancelled" } });
}

export async function deliverDueReminders(now = new Date()) {
  const due = await MatchReminder.find({ status: "pending", scheduledFor: { $lte: now } }).sort({ scheduledFor: 1 }).limit(100).lean();
  for (const reminder of due) {
    await tx(async () => {
      const match = await Match.findById(reminder.match);
      const claimed = await MatchReminder.findOneAndUpdate({ _id: reminder._id, status: "pending", scheduledFor: { $lte: now } }, { $set: { status: "sent", sentAt: now } }, { returnDocument: "after" });
      if (!claimed) return;
      if (!match || match.status !== "scheduled" || match.reminderRevision !== reminder.reminderRevision) return;
      const duration = reminder.offsetMinutes % 1440 === 0 ? `${reminder.offsetMinutes / 1440} day${reminder.offsetMinutes / 1440 === 1 ? "" : "s"}` : reminder.offsetMinutes % 60 === 0 ? `${reminder.offsetMinutes / 60} hour${reminder.offsetMinutes / 60 === 1 ? "" : "s"}` : `${reminder.offsetMinutes} minutes`;
      await notify(reminder.user, "match-reminder", `Your match starts in ${duration}.`, match._id, "match", `match:${match._id}:reminder:${reminder.user}:${reminder.offsetMinutes}:${reminder.reminderRevision}`, `/matches/${match._id}`);
    });
  }
}

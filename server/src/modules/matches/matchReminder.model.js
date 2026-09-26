import { model, ref } from "../../utils/model.js";

export default model("MatchReminder", {
  match: ref("Match"),
  user: ref("User"),
  offsetMinutes: { type: Number, min: 1, max: 10080, required: true },
  reminderRevision: { type: Number, required: true },
  scheduledFor: { type: Date, required: true },
  status: { type: String, enum: ["pending", "sent", "cancelled"], default: "pending" },
  sentAt: { type: Date, default: null },
}, [[{ match: 1, user: 1, offsetMinutes: 1, reminderRevision: 1 }, { unique: true }], [{ status: 1, scheduledFor: 1 }, {}]]);

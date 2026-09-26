import { model, ref, venueSchema } from "../../utils/model.js";

export const RecruitmentRequest = model("RecruitmentRequest", {
  organizer: ref("User"),
  sport: ref("Sport"),
  startsAt: { type: Date, required: true },
  venue: { type: venueSchema, required: true },
  skillPreference: { type: String, enum: ["Any", "Beginner", "Intermediate", "Advanced"], default: "Any" },
  slots: { type: Number, min: 1, max: 100, required: true },
  confirmedPlayers: [ref("User")],
  status: { type: String, enum: ["open", "closed", "expired"], default: "open" },
  revision: { type: Number, default: 0 },
}, [[{ startsAt: 1, status: 1 }, {}], [{ "venue.location": "2dsphere" }, {}]]);

export const RecruitmentApplication = model("RecruitmentApplication", {
  request: ref("RecruitmentRequest"),
  user: ref("User"),
  status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled"], default: "pending" },
}, [[{ request: 1, user: 1 }, { unique: true }]]);

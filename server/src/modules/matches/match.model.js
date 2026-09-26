import mongoose from "mongoose";
import {
  model,
  ref,
  venueSchema,
} from "../../utils/model.js";

const proposalSchema = new mongoose.Schema(
  {
    proposedByTeam: ref("Team"),
    revision: Number,
    startsAt: Date,
    endsAt: Date,
    venue: venueSchema,
  },
  { _id: false },
);

export default model(
  "Match",
  {
    challenge: { ...ref("Challenge"), unique: true },
    homeTeam: ref("Team"),
    awayTeam: ref("Team"),
    sport: ref("Sport"),
    homeRosterUserIds: [ref("User", false)],
    awayRosterUserIds: [ref("User", false)],

    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    venue: { type: venueSchema, required: true },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    revision: { type: Number, default: 0 },
    scheduleRevision: { type: Number, default: 0 },
    reminderRevision: { type: Number, default: 0 },
    reminderOffsetsMinutes: { type: [Number], default: [1440, 60] },

    scheduleProposal: {
      type: proposalSchema,
      default: undefined,
    },
  },
  [
    [{ homeTeam: 1, startsAt: 1 }, {}],
    [{ awayTeam: 1, startsAt: 1 }, {}],
    [{ homeTeam: 1, status: 1, startsAt: -1 }, {}],
    [{ awayTeam: 1, status: 1, startsAt: -1 }, {}],
    [{ sport: 1, status: 1, startsAt: -1 }, {}],
    [{ homeRosterUserIds: 1, status: 1, startsAt: -1 }, {}],
    [{ awayRosterUserIds: 1, status: 1, startsAt: -1 }, {}],
  ],
);

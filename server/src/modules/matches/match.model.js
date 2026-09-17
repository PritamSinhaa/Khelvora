import mongoose from "mongoose";
import {
  model,
  ref,
  venueSchema,
} from "../../utils/model.js";

const proposalSchema = new mongoose.Schema(
  {
    proposedByTeam: ref("Team"),
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

    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    venue: { type: venueSchema, required: true },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    revision: { type: Number, default: 0 },

    scheduleProposal: {
      type: proposalSchema,
      default: undefined,
    },
  },
  [
    [{ homeTeam: 1, startsAt: 1 }, {}],
    [{ awayTeam: 1, startsAt: 1 }, {}],
  ],
);
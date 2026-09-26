import mongoose from "mongoose";
import { model, ref } from "../../utils/model.js";

const correctionSchema = new mongoose.Schema({
  proposedByTeam: ref("Team"),
  homeScore: { type: Number, min: 0, required: true },
  awayScore: { type: Number, min: 0, required: true },
  notes: { type: String, default: "" },
  proposedAt: { type: Date, default: Date.now },
}, { _id: false });

export default model("Result", {
  match: { ...ref("Match"), unique: true },
  submittedByTeam: ref("Team"),
  homeScore: { type: Number, min: 0, required: true },
  awayScore: { type: Number, min: 0, required: true },
  notes: { type: String, default: "" },
  correctionProposal: { type: correctionSchema, default: undefined },
  correctionCount: { type: Number, default: 0 },
  confirmedAt: { type: Date, default: null },

  status: {
    type: String,
    enum: ["pending", "confirmed", "disputed"],
    default: "pending",
  },
}, [[{ status: 1, match: 1 }, {}]]);

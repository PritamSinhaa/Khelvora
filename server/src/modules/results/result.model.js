import { model, ref } from "../../utils/model.js";

export default model("Result", {
  match: { ...ref("Match"), unique: true },
  submittedByTeam: ref("Team"),
  homeScore: { type: Number, min: 0, required: true },
  awayScore: { type: Number, min: 0, required: true },
  notes: { type: String, default: "" },

  status: {
    type: String,
    enum: ["pending", "confirmed", "disputed"],
    default: "pending",
  },
});
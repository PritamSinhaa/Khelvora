import { model, ref } from "../../utils/model.js";

export default model("Report", {
  reporter: ref("User"),
  targetUser: ref("User"),
  reason: { type: String, required: true },

  status: {
    type: String,
    enum: ["open", "resolved", "dismissed"],
    default: "open",
  },

  resolution: { type: String, default: "" },
});
import { model, ref } from "../../utils/model.js";

export default model("Conversation", {
  kind: {
    type: String,
    enum: ["direct", "team", "team-inquiry", "match"],
    required: true,
  },

  key: { type: String, required: true, unique: true },
  participants: [ref("User")],
  team: ref("Team", false),
  match: ref("Match", false),
  requester: ref("User", false),
});
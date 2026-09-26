import { model, ref } from "../../utils/model.js";

export default model(
  "Attendance",
  {
    match: ref("Match"),
    user: ref("User"),
    teamAtResponse: { ...ref("Team", false), default: null },

    response: {
      type: String,
      enum: ["yes", "no", "maybe"],
      required: true,
    },
  },
  [[{ match: 1, user: 1 }, { unique: true }], [{ user: 1, match: 1, response: 1 }, {}]],
);

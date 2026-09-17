import { model, ref } from "../../utils/model.js";

export default model(
  "Attendance",
  {
    match: ref("Match"),
    user: ref("User"),

    response: {
      type: String,
      enum: ["yes", "no", "maybe"],
      required: true,
    },
  },
  [[{ match: 1, user: 1 }, { unique: true }]],
);

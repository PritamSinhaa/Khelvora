import { model, ref } from "../../utils/model.js";

export default model(
  "JoinRequest",
  {
    team: ref("Team"),
    user: ref("User"),
    message: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
  },
  [
    [
      { team: 1, user: 1 },
      {
        unique: true,
        partialFilterExpression: { status: "pending" },
      },
    ],
    [{ team: 1, status: 1, createdAt: 1 }, {}],
  ],
);

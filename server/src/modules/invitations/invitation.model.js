import { model, ref } from "../../utils/model.js";

export default model(
  "Invitation",
  {
    team: ref("Team"),
    user: ref("User"),
    invitedBy: ref("User"),
    expiresAt: { type: Date, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "expired",
      ],
      default: "pending",
    },
  },
  [[
    { team: 1, user: 1 },
    {
      unique: true,
      partialFilterExpression: { status: "pending" },
    },
  ]],
);
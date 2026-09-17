import {
  model,
  ref,
  venueSchema,
} from "../../utils/model.js";

export default model(
  "Challenge",
  {
    fromTeam: ref("Team"),
    toTeam: ref("Team"),
    createdBy: ref("User"),
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    venue: { type: venueSchema, required: true },

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
  [
    [{ fromTeam: 1, status: 1 }, {}],
    [{ toTeam: 1, status: 1 }, {}],
  ],
);
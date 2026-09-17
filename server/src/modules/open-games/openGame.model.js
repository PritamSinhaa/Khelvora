import {
  model,
  ref,
  venueSchema,
} from "../../utils/model.js";

export default model(
  "OpenGame",
  {
    host: ref("User"),
    sport: ref("Sport"),
    title: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    venue: { type: venueSchema, required: true },
    capacity: { type: Number, required: true },
    players: [ref("User")],

    status: {
      type: String,
      enum: ["open", "cancelled"],
      default: "open",
    },
  },
  [[{ "venue.location": "2dsphere" }, {}]],
);
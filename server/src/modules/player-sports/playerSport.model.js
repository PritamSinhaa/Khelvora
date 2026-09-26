import { model, ref } from "../../utils/model.js";

export default model(
  "PlayerSport",
  {
    user: ref("User"),
    sport: ref("Sport"),

    skillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },

    positions: [String],

    availability: [{
      _id: false,
      day: { type: Number, min: 0, max: 6 },
      from: String,
      to: String,
    }],

    timeZone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  [
    [{ user: 1, sport: 1 }, { unique: true }],
    [{ sport: 1, user: 1 }, {}],
  ],
);

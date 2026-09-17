import {
  model,
  ref,
  pointSchema,
} from "../../utils/model.js";

export default model(
  "Team",
  {
    name: { type: String, required: true, maxlength: 80 },
    sport: ref("Sport"),
    leader: ref("User"),
    bio: { type: String, default: "" },
    city: { type: String, required: true },
    location: { type: pointSchema, required: true },

    skillLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      required: true,
    },

    lookingForPlayers: { type: Boolean, default: true },
    maxMembers: { type: Number, min: 2, max: 100, default: 30 },
    memberCount: { type: Number, default: 1 },
    revision: { type: Number, default: 0 },
    avatarUrl: { type: String, default: null },
  },
  [
    [{ location: "2dsphere" }, {}],
    [{ sport: 1, lookingForPlayers: 1 }, {}],
  ],
);
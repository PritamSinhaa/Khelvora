import { model, ref } from "../../utils/model.js";

export const AvailabilityPoll = model("AvailabilityPoll", {
  teamIds: [ref("Team")],
  match: { ...ref("Match", false), default: null },
  createdBy: ref("User"),
  closesAt: { type: Date, required: true },
  options: [{ startsAt: { type: Date, required: true }, endsAt: { type: Date, required: true } }],
  status: { type: String, enum: ["open", "closed"], default: "open" },
  selectedOption: { type: Number, default: null },
  revision: { type: Number, default: 0 },
}, [[{ match: 1, status: 1 }, { unique: true, partialFilterExpression: { match: { $type: "objectId" }, status: "open" } }]]);

export const PollResponse = model("PollResponse", {
  poll: ref("AvailabilityPoll"),
  user: ref("User"),
  option: { type: Number, required: true },
  response: { type: String, enum: ["available", "unavailable", "maybe"], required: true },
}, [[{ poll: 1, user: 1, option: 1 }, { unique: true }]]);

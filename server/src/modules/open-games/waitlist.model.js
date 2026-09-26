import { model, ref } from "../../utils/model.js";

export default model("OpenGameWaitlistEntry", {
  game: ref("OpenGame"),
  user: ref("User"),
  status: { type: String, enum: ["queued", "offered", "accepted", "declined", "expired", "cancelled"], default: "queued" },
  active: { type: Boolean, default: true },
  offeredAt: { type: Date, default: null },
  offerExpiresAt: { type: Date, default: null },
  handledAt: { type: Date, default: null },
}, [[{ game: 1, status: 1, createdAt: 1 }, {}], [{ game: 1, user: 1 }, { unique: true, partialFilterExpression: { active: true } }], [{ status: 1, offerExpiresAt: 1 }, {}]]);

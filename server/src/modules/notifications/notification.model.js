import { model, ref } from "../../utils/model.js";

export default model(
  "Notification",
  {
    user: ref("User"),
    type: { type: String, required: true },
    text: { type: String, required: true },
    entityId: { type: String, default: null },
    readAt: { type: Date, default: null },
    emittedAt: { type: Date, default: null },
  },
  [[{ user: 1, createdAt: -1 }, {}]],
);
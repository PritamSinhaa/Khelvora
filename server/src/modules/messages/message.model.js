import { model, ref } from "../../utils/model.js";

export default model(
  "Message",
  {
    conversation: ref("Conversation"),
    sender: ref("User"),
    text: { type: String, required: true, maxlength: 2000 },
    clientId: { type: String, required: true },
  },
  [
    [{ conversation: 1, createdAt: -1, _id: -1 }, {}],
    [
      { conversation: 1, sender: 1, clientId: 1 },
      { unique: true },
    ],
  ],
);
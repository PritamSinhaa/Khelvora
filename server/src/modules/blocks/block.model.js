import { model, ref } from "../../utils/model.js";

export default model(
  "Block",
  {
    owner: ref("User"),
    target: ref("User"),
  },
  [[{ owner: 1, target: 1 }, { unique: true }]],
);
import { model, ref } from "../../utils/model.js";

export default model(
  "Membership",
  {
    team: ref("Team"),
    user: ref("User"),
  },
  [
    [{ team: 1, user: 1 }, { unique: true }],
    [{ user: 1 }, {}],
  ],
);

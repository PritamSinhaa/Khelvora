import { model } from "../../utils/model.js";

export default model("Sport", {
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  defaultTeamSize: { type: Number, required: true, min: 1 },
});
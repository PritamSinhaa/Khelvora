import { model, ref } from "../../utils/model.js";

export default model("Upload", {
  owner: ref("User"),
  publicId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
});
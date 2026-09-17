import Sport from "./sport.model.js";

export const list = () => Sport.find().sort({ name: 1 });
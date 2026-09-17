import * as service from "./sport.service.js";
import { respond } from "../../utils/http.js";

export const list = respond(() => service.list());
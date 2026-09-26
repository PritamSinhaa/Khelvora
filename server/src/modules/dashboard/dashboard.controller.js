import * as service from "./dashboard.service.js";
import { respond } from "../../utils/http.js";

export const actions = respond((req) => service.actions(req.user));
export const unreadConversations = respond((req) => service.unreadConversations(req.user));

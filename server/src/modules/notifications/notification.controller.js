import * as service from "./notification.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const read = respond((req) =>
  service.read(req.user, req.params.id),
);

export const unreadCount = respond((req) => service.unreadCount(req.user));

export const readAll = respond((req) => service.readAll(req.user));

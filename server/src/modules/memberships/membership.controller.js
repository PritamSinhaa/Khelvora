import * as service from "./membership.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.params.id, req.validated.query),
);

export const leave = respond((req) =>
  service.leave(req.user, req.params.id),
);

export const remove = respond((req) =>
  service.remove(req.user, req.params.id),
);
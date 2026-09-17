import * as service from "./attendance.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.params.id),
);

export const save = respond((req) =>
  service.save(req.user, req.validated.body),
);
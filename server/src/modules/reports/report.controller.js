import * as service from "./report.service.js";
import { respond } from "../../utils/http.js";

export const create = respond(
  (req) => service.create(req.user, req.validated.body),
  201,
);

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const resolve = respond((req) =>
  service.resolve(req.params.id, req.validated.body),
);
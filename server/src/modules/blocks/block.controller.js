import * as service from "./block.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const create = respond(
  (req) => service.create(req.user, req.validated.body.userId),
  201,
);

export const remove = respond((req) =>
  service.remove(req.user, req.params.id),
);
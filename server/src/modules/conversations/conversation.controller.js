import * as service from "./conversation.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const create = respond(
  (req) => service.create(req.user, req.validated.body),
  201,
);

export const detail = respond((req) =>
  service.access(req.params.id, req.user._id),
);
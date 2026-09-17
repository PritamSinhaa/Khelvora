import * as service from "./openGame.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.validated.query),
);

export const create = respond(
  (req) => service.create(req.user, req.validated.body),
  201,
);

export const join = respond((req) =>
  service.join(req.user, req.params.id),
);

export const leave = respond((req) =>
  service.leave(req.user, req.params.id),
);

export const cancel = respond((req) =>
  service.cancel(req.user, req.params.id),
);
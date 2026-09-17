import * as service from "./invitation.service.js";
import { respond } from "../../utils/http.js";

export const create = respond(
  (req) => service.create(req.user, req.validated.body),
  201,
);

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const decide = respond((req) =>
  service.decide(
    req.user,
    req.params.id,
    req.validated.body.decision,
  ),
);
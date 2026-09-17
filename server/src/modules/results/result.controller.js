import * as service from "./result.service.js";
import { respond } from "../../utils/http.js";

export const get = respond((req) =>
  service.get(req.user, req.params.id),
);

export const submit = respond(
  (req) => service.submit(req.user, req.validated.body),
  201,
);

export const decide = respond((req) =>
  service.decide(
    req.user,
    req.params.id,
    req.validated.body.decision,
  ),
);
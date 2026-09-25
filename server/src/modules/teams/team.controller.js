import * as service from "./team.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) => service.list(req.validated.query));

export const detail = respond((req) => service.detail(req.params.id));

export const mine = respond((req) => service.mine(req.user));

export const create = respond(
  (req) => service.create(req.user, req.validated.body),
  201,
);

export const update = respond((req) =>
  service.update(req.user, req.params.id, req.validated.body),
);

export const transfer = respond((req) =>
  service.transfer(req.user, req.params.id, req.validated.body.userId),
);

export const stats = respond((req) => service.stats(req.params.id));

export const setCover = respond((req) =>
  service.setCover(
    req.user,
    req.params.id,
    req.validated.body.uploadId,
  ),
);
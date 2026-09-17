import * as service from "./user.service.js";
import { respond } from "../../utils/http.js";

export const me = respond((req) =>
  service.me(req.user),
);

export const update = respond((req) =>
  service.update(req.user, req.validated.body),
);

export const profile = respond((req) =>
  service.profile(req.user, req.params.id),
);
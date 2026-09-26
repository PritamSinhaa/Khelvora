import * as service from "./match.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const upcoming = respond((req) => service.upcoming(req.user));

export const detail = respond((req) =>
  service.detail(req.user, req.params.id),
);

export const propose = respond((req) =>
  service.propose(req.user, req.params.id, req.validated.body),
);

export const decide = respond((req) =>
  service.decide(
    req.user,
    req.params.id,
    req.validated.body.decision,
  ),
);

export const cancel = respond((req) =>
  service.cancel(req.user, req.params.id),
);

export const setReminders = respond((req) => service.setReminders(req.user, req.params.id, req.validated.body.offsetsMinutes));

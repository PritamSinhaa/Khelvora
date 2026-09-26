import * as service from "./openGame.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const nearby = respond((req) => service.nearby(req.user));

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

export const joinWaitlist = respond((req) => service.joinWaitlist(req.user, req.params.id), 201);
export const leaveWaitlist = respond((req) => service.leaveWaitlist(req.user, req.params.id));
export const acceptOffer = respond((req) => service.acceptOffer(req.user, req.params.id));
export const declineOffer = respond((req) => service.declineOffer(req.user, req.params.id));

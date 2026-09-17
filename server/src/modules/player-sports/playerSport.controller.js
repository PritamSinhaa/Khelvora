import * as service from "./playerSport.service.js";
import { respond } from "../../utils/http.js";

export const mine = respond((req) =>
  service.mine(req.user),
);

export const save = respond((req) =>
  service.save(req.user, req.validated.body),
);

export const remove = respond((req) =>
  service.remove(req.user, req.params.id),
);
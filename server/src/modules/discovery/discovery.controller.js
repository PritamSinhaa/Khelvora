import * as service from "./discovery.service.js";
import { respond } from "../../utils/http.js";

export const teams = respond((req) =>
  service.teams(req.user, req.validated.query),
);

export const players = respond((req) =>
  service.players(req.user, req.validated.query),
);
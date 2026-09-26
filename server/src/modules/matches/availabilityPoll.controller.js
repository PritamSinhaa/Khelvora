import * as service from "./availabilityPoll.service.js";
import { respond } from "../../utils/http.js";
export const create = respond((req) => service.create(req.user, req.validated.body), 201);
export const matchList = respond((req) => service.listForMatch(req.user, req.params.id));
export const teamList = respond((req) => service.listForTeam(req.user, req.params.id));
export const vote = respond((req) => service.vote(req.user, req.params.id, req.validated.body.option, req.validated.body.response));
export const close = respond((req) => service.close(req.user, req.params.id, req.validated.body.selectedOption));

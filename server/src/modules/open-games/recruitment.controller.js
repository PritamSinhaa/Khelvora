import * as service from "./recruitment.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) => service.list(req.validated.query, req.user));
export const create = respond((req) => service.create(req.user, req.validated.body), 201);
export const apply = respond((req) => service.apply(req.user, req.params.id), 201);
export const applications = respond((req) => service.applications(req.user, req.params.id));
export const decide = respond((req) => service.decide(req.user, req.params.id, req.validated.body.decision));
export const cancelApplication = respond((req) => service.cancelApplication(req.user, req.params.id));
export const close = respond((req) => service.close(req.user, req.params.id));

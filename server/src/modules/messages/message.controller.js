import * as service from "./message.service.js";
import { respond } from "../../utils/http.js";

export const list = respond((req) =>
  service.list(req.user, req.validated.query),
);

export const send = respond(
  (req) => service.send(req.user, req.validated.body),
  201,
);
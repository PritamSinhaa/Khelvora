import * as service from "./upload.service.js";
import { respond } from "../../utils/http.js";

export const create = respond(
  (req) => service.create(req.user, req.file),
  201,
);

export const useAvatar = respond((req) =>
  service.useAvatar(req.user, req.validated.body.uploadId),
);
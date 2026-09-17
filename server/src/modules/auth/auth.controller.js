import * as service from "./auth.service.js";
import { respond } from "../../utils/http.js";

export const register = respond(
  (req) => service.register(req.validated.body),
  201,
);

export const login = respond((req) =>
  service.login(req.validated.body),
);

export const logout = respond((req) =>
  service.logout(req.user),
);

export const changePassword = respond((req) =>
  service.changePassword(req.user, req.validated.body),
);
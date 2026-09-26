import moduleRouter from "../../utils/router.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import { authLimiter } from "../../middleware/rateLimiter.js";
import * as controller from "./auth.controller.js";
import * as validation from "./auth.validation.js";

const router = moduleRouter(false);

router.post(
  "/register",
  authLimiter,
  validate(validation.register),
  controller.register,
);

router.post(
  "/login",
  authLimiter,
  validate(validation.login),
  controller.login,
);

router.post(
  "/google",
  authLimiter,
  validate(validation.google),
  controller.google,
);

router.post("/logout", authenticate, controller.logout);

router.patch(
  "/password",
  authenticate,
  authLimiter,
  validate(validation.changePassword),
  controller.changePassword,
);

export default router;

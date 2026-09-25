import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import AppError from "./AppError.js";
import { id } from "./validation.js";

export default function moduleRouter(protectedRoutes = true) {
  const router = Router();

  // Require authentication by default.
  if (protectedRoutes) {
    router.use(authenticate);
  }

  // Validate route parameters such as /teams/:id.
  router.param("id", (req, res, next, value) => {
    const result = id.safeParse(value);

    if (!result.success) {
      return next(new AppError("Invalid ID.", 400));
    }

    next();
  });

  return router;
}
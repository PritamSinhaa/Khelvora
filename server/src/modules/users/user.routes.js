import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./user.controller.js";
import * as validation from "./user.validation.js";

const router = moduleRouter();

router.get("/me", controller.me);
router.get("/me/match-history", validate(validation.matchHistory, "query"), controller.matchHistory);
router.patch("/me", validate(validation.update), controller.update);
router.get(
  "/me/reverse-location",
  validate(validation.reverseLocation, "query"),
  controller.reverseLocation,
);
router.get("/:id", controller.profile);

export default router;

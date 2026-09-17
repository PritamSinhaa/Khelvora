import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./discovery.controller.js";
import * as validation from "./discovery.validation.js";

const router = moduleRouter();

router.get(
  "/teams",
  validate(validation.list, "query"),
  controller.teams,
);

router.get(
  "/players",
  validate(validation.list, "query"),
  controller.players,
);

export default router;
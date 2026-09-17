import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./match.controller.js";
import * as validation from "./match.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);
router.get("/:id", controller.detail);

router.post(
  "/:id/schedule",
  validate(validation.propose),
  controller.propose,
);

router.patch(
  "/:id/schedule",
  validate(validation.decide),
  controller.decide,
);

router.post("/:id/cancel", controller.cancel);

export default router;
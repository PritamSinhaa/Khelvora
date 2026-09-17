import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./team.controller.js";
import * as validation from "./team.validation.js";

const router = moduleRouter();

router.get("/mine", controller.mine);
router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);

router.get("/:id/stats", controller.stats);

router.patch(
  "/:id/leader",
  validate(validation.transfer),
  controller.transfer,
);

router.get("/:id", controller.detail);
router.patch("/:id", validate(validation.update), controller.update);

export default router;
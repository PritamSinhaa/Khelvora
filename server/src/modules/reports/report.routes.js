import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import authorize from "../../middleware/authorize.js";
import * as controller from "./report.controller.js";
import * as validation from "./report.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);

router.patch(
  "/:id",
  authorize("admin"),
  validate(validation.resolve),
  controller.resolve,
);

export default router;
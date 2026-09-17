import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./membership.controller.js";
import * as validation from "./membership.validation.js";

const router = moduleRouter();

router.get("/teams/:id", validate(validation.list, "query"), controller.list);

router.delete("/teams/:id/me", controller.leave);
router.delete("/:id", controller.remove);

export default router;

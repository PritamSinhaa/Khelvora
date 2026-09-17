import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./openGame.controller.js";
import * as validation from "./openGame.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);
router.post("/:id/join", controller.join);
router.post("/:id/leave", controller.leave);
router.post("/:id/cancel", controller.cancel);

export default router;
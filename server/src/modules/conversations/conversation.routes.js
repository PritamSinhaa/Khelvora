import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./conversation.controller.js";
import * as validation from "./conversation.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);
router.get("/:id", controller.detail);

export default router;
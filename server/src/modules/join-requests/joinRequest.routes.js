import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./joinRequest.controller.js";
import * as validation from "./joinRequest.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);
router.patch("/:id", validate(validation.decide), controller.decide);

export default router;
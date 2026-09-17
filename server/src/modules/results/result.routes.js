import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./result.controller.js";
import * as validation from "./result.validation.js";

const router = moduleRouter();

router.get("/matches/:id", controller.get);
router.post("/", validate(validation.submit), controller.submit);
router.patch("/:id", validate(validation.decide), controller.decide);

export default router;
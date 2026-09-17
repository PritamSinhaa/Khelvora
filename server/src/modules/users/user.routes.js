import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./user.controller.js";
import * as validation from "./user.validation.js";

const router = moduleRouter();

router.get("/me", controller.me);
router.patch("/me", validate(validation.update), controller.update);
router.get("/:id", controller.profile);

export default router;
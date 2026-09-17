import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./attendance.controller.js";
import * as validation from "./attendance.validation.js";

const router = moduleRouter();

router.get("/matches/:id", controller.list);
router.put("/", validate(validation.save), controller.save);

export default router;
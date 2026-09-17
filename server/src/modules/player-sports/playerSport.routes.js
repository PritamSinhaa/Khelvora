import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./playerSport.controller.js";
import * as validation from "./playerSport.validation.js";

const router = moduleRouter();

router.get("/", controller.mine);
router.put("/", validate(validation.save), controller.save);
router.delete("/:id", controller.remove);

export default router;
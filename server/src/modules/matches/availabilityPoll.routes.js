import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./availabilityPoll.controller.js";
import * as validation from "./availabilityPoll.validation.js";

const router = moduleRouter();
router.post("/", validate(validation.create), controller.create);
router.put("/:id/votes", validate(validation.vote), controller.vote);
router.post("/:id/close", validate(validation.close), controller.close);
export default router;

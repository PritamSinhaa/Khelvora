import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./team.controller.js";
import * as validation from "./team.validation.js";
import * as pollController from "../matches/availabilityPoll.controller.js";

const router = moduleRouter();

router.get("/mine", controller.mine);
router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);

router.get("/:id/stats", controller.stats);
router.get("/:id/history", validate(validation.history, "query"), controller.history);
router.get("/:id/availability-polls", pollController.teamList);

router.patch("/:id/leader", validate(validation.transfer), controller.transfer);

router.get("/:id", controller.detail);
router.patch("/:id", validate(validation.update), controller.update);
router.put("/:id/cover", validate(validation.cover), controller.setCover);
export default router;

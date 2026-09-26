import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./match.controller.js";
import * as validation from "./match.validation.js";
import * as pollController from "./availabilityPoll.controller.js";

const router = moduleRouter();

router.get("/upcoming", controller.upcoming);
router.get("/", validate(validation.list, "query"), controller.list);
router.get("/:id", controller.detail);
router.get("/:id/availability-polls", pollController.matchList);
router.put("/:id/reminders", validate(validation.reminders), controller.setReminders);

router.post(
  "/:id/schedule",
  validate(validation.propose),
  controller.propose,
);

router.patch(
  "/:id/schedule",
  validate(validation.decide),
  controller.decide,
);

router.post("/:id/cancel", controller.cancel);

export default router;

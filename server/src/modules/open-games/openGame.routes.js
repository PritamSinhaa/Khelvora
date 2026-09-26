import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./openGame.controller.js";
import * as validation from "./openGame.validation.js";
import * as recruitment from "./recruitment.controller.js";
import * as recruitmentValidation from "./recruitment.validation.js";

const router = moduleRouter();

router.get("/nearby", controller.nearby);
router.get("/urgent", validate(recruitmentValidation.list, "query"), recruitment.list);
router.post("/urgent", validate(recruitmentValidation.create), recruitment.create);
router.post("/urgent/:id/apply", recruitment.apply);
router.get("/urgent/:id/applications", recruitment.applications);
router.patch("/urgent/applications/:id", validate(recruitmentValidation.decision), recruitment.decide);
router.post("/urgent/applications/:id/cancel", recruitment.cancelApplication);
router.post("/urgent/:id/close", recruitment.close);

router.get("/", validate(validation.list, "query"), controller.list);
router.post("/", validate(validation.create), controller.create);
router.post("/:id/waitlist", controller.joinWaitlist);
router.delete("/:id/waitlist", controller.leaveWaitlist);
router.post("/:id/waitlist/accept", controller.acceptOffer);
router.post("/:id/waitlist/decline", controller.declineOffer);
router.post("/:id/join", controller.join);
router.post("/:id/leave", controller.leave);
router.post("/:id/cancel", controller.cancel);

export default router;

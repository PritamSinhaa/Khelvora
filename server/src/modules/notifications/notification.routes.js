import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./notification.controller.js";
import * as validation from "./notification.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);
router.get("/unread-count", controller.unreadCount);
router.patch("/read-all", controller.readAll);
router.patch("/:id/read", controller.read);
router.delete("/:id", controller.remove);

export default router;

import moduleRouter from "../../utils/router.js";
import * as controller from "./dashboard.controller.js";

const router = moduleRouter();
router.get("/actions", controller.actions);
router.get("/unread-conversations", controller.unreadConversations);
export default router;

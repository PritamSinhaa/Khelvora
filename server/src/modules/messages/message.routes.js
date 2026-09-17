import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import { messageLimiter } from "../../middleware/rateLimiter.js";
import * as controller from "./message.controller.js";
import * as validation from "./message.validation.js";

const router = moduleRouter();

router.get("/", validate(validation.list, "query"), controller.list);

router.post(
  "/",
  messageLimiter,
  validate(validation.send),
  controller.send,
);

export default router;
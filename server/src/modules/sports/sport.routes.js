import moduleRouter from "../../utils/router.js";
import { list } from "./sport.controller.js";

const router = moduleRouter(false);

router.get("/", list);

export default router;
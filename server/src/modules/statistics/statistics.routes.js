import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import * as controller from "./statistics.controller.js";
import * as validation from "./statistics.validation.js";

const router = moduleRouter();
router.get("/leaderboards/teams", validate(validation.leaderboard, "query"), controller.leaderboard);
export default router;

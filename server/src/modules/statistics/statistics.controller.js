import * as service from "./statistics.service.js";
import { respond } from "../../utils/http.js";
export const leaderboard = respond((req) => service.teamLeaderboard(req.validated.query));

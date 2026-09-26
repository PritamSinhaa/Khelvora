import Attendance from "./attendance.model.js";
import Membership from "../memberships/membership.model.js";

import { tx } from "../../services/access.service.js";

import {
  lockMatch,
  matchMember,
} from "../../services/matchAccess.service.js";

import AppError from "../../utils/AppError.js";

export const save = (user, data) => tx(async () => {
  const match = await lockMatch(data.matchId);

  await matchMember(match._id, user._id);

  if (
    match.status !== "scheduled" ||
    match.startsAt <= new Date()
  ) {
    throw new AppError("Attendance is closed.", 409);
  }

  const teams = await Membership.find({ user: user._id, team: { $in: [match.homeTeam, match.awayTeam] } }).distinct("team");
  const teamAtResponse = teams.length === 1 ? teams[0] : null;

  return Attendance.findOneAndUpdate(
    { match: match._id, user: user._id },
    { $set: { response: data.response, teamAtResponse } },
    { upsert: true, new: true },
  );
});

export async function list(user, id) {
  const match = await matchMember(id, user._id);

  const ids = await Membership.find({
    team: { $in: [match.homeTeam, match.awayTeam] },
  }).distinct("user");

  return Attendance.find({
    match: id,
    user: { $in: ids },
  }).populate("user", "name avatarUrl");
}

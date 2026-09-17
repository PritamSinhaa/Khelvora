import Match from "../modules/matches/match.model.js";
import Team from "../modules/teams/team.model.js";
import Membership from "../modules/memberships/membership.model.js";

import AppError from "../utils/AppError.js";
import { must, same, lockTeams } from "./access.service.js";

export async function matchMember(id, user) {
  const match = await must(Match, id);

  const membership = await Membership.exists({
    user,
    team: { $in: [match.homeTeam, match.awayTeam] },
  });

  if (!membership) {
    throw new AppError("Match membership required.", 403);
  }

  return match;
}

export async function matchLeader(match, user) {
  const teams = await Team.find({
    _id: { $in: [match.homeTeam, match.awayTeam] },
    leader: user,
  });

  if (teams.length !== 1) {
    throw new AppError(
      "An opposing team leader is required.",
      403,
    );
  }

  return teams[0]._id;
}

export async function lockMatch(id) {
  const match = await must(Match, id);

  await lockTeams([match.homeTeam, match.awayTeam]);

  return Match.findByIdAndUpdate(
    id,
    { $inc: { revision: 1 } },
    { new: true },
  );
}

export async function ensureFree(
  teams,
  startsAt,
  endsAt,
  exclude,
) {
  const conflict = await Match.exists({
    status: "scheduled",
    ...(exclude ? { _id: { $ne: exclude } } : {}),

    $or: [
      { homeTeam: { $in: teams } },
      { awayTeam: { $in: teams } },
    ],

    startsAt: { $lt: new Date(endsAt) },
    endsAt: { $gt: new Date(startsAt) },
  });

  if (conflict) {
    throw new AppError(
      "A team already has a match during this time.",
      409,
    );
  }
}

export function future(start) {
  if (new Date(start) <= new Date()) {
    throw new AppError(
      "Start time must be in the future.",
      409,
    );
  }
}

export { same };
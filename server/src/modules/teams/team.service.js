import Team from "./team.model.js";
import Membership from "../memberships/membership.model.js";
import Conversation from "../conversations/conversation.model.js";
import Result from "../results/result.model.js";
import Match from "../matches/match.model.js";

import {
  tx,
  leader,
  lockTeams,
  member,
  sportExists,
  activeUser,
  must,
} from "../../services/access.service.js";

import {
  pageOptions,
  escapeRegex,
} from "../../utils/http.js";

import AppError from "../../utils/AppError.js";

export function list(query) {
  const filter = {
    ...(query.sport ? { sport: query.sport } : {}),
    ...(query.q
      ? { name: { $regex: escapeRegex(query.q), $options: "i" } }
      : {}),
  };

  return Team.find(filter)
    .populate("sport")
    .sort({ _id: -1 })
    .skip(pageOptions(query).skip)
    .limit(query.limit);
}

export const detail = (id) => must(Team, id);

export async function mine(user) {
  const ids = await Membership.find({
    user: user._id,
  }).distinct("team");

  return Team.find({ _id: { $in: ids } }).populate("sport");
}

export const create = (user, data) => tx(async () => {
  await sportExists(data.sport);

  const team = await Team.create({
    ...data,
    leader: user._id,
  });

  await Membership.create({
    team: team._id,
    user: user._id,
  });

  await Conversation.create({
    kind: "team",
    team: team._id,
    key: `team:${team.id}`,
  });

  return team;
});

export const update = (user, id, data) => tx(async () => {
  await lockTeams([id]);

  const team = await leader(id, user._id);

  if (
    data.maxMembers !== undefined &&
    data.maxMembers < team.memberCount
  ) {
    throw new AppError(
      "Capacity cannot be below member count.",
      409,
    );
  }

  Object.assign(team, data);
  await team.save();

  return team;
});

export const transfer = (user, id, target) => tx(async () => {
  await lockTeams([id]);

  const team = await leader(id, user._id);

  await member(id, target);
  await activeUser(target);

  team.leader = target;
  await team.save();

  return team;
});

export async function stats(id) {
  await must(Team, id);

  const matches = await Match.find({
    $or: [{ homeTeam: id }, { awayTeam: id }],
    status: "completed",
  });

  const results = await Result.find({
    match: { $in: matches.map((match) => match._id) },
    status: "confirmed",
  });

  const byMatch = new Map(
    matches.map((match) => [match.id, match]),
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const result of results) {
    const match = byMatch.get(String(result.match));
    const home = String(match.homeTeam) === id;

    const own = home ? result.homeScore : result.awayScore;
    const other = home ? result.awayScore : result.homeScore;

    if (own > other) wins++;
    else if (own === other) draws++;
    else losses++;
  }

  return { played: results.length, wins, draws, losses };
}
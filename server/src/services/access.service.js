import mongoose from "mongoose";

import AppError from "../utils/AppError.js";
import Team from "../modules/teams/team.model.js";
import Membership from "../modules/memberships/membership.model.js";
import Block from "../modules/blocks/block.model.js";
import Sport from "../modules/sports/sport.model.js";
import User from "../modules/users/user.model.js";

export const same = (a, b) => String(a) === String(b);

export const tx = (handler) =>
  mongoose.connection.transaction(handler);

export async function must(Model, id) {
  const document = await Model.findById(id);

  if (!document) {
    throw new AppError("Record not found.", 404);
  }

  return document;
}

export async function activeUser(id) {
  const user = await User.findOne({
    _id: id,
    isActive: true,
  });

  if (!user) {
    throw new AppError("Player not available.", 404);
  }

  return user;
}

export const sportExists = (id) => must(Sport, id);

export async function member(team, user) {
  if (!await Membership.exists({ team, user })) {
    throw new AppError("Team membership required.", 403);
  }
}

export async function leader(teamId, userId) {
  const team = await must(Team, teamId);

  if (!same(team.leader, userId)) {
    throw new AppError(
      "Only the team leader can do this.",
      403,
    );
  }

  return team;
}

export async function lockTeams(ids) {
  const orderedIds = [...new Set(ids.map(String))].sort();

  for (const id of orderedIds) {
    const team = await Team.findByIdAndUpdate(id, {
      $inc: { revision: 1 },
    });

    if (!team) {
      throw new AppError("Team not found.", 404);
    }
  }
}

export async function ensureUnblocked(a, b) {
  const blocked = await Block.exists({
    $or: [
      { owner: a, target: b },
      { owner: b, target: a },
    ],
  });

  if (blocked) {
    throw new AppError(
      "This interaction is unavailable.",
      403,
    );
  }
}

// Call within a transaction after lockTeams().
export async function addMember(teamId, userId) {
  const team = await must(Team, teamId);

  if (await Membership.exists({ team: teamId, user: userId })) {
    throw new AppError("Already a member.", 409);
  }

  if (team.memberCount >= team.maxMembers) {
    throw new AppError("Team is full.", 409);
  }

  await activeUser(userId);

  await Membership.create({
    team: teamId,
    user: userId,
  });

  await Team.updateOne(
    { _id: teamId },
    { $inc: { memberCount: 1 } },
  );
}
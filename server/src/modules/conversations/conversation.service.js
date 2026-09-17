import Conversation from "./conversation.model.js";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";
import Match from "../matches/match.model.js";

import {
  must,
  member,
  same,
  activeUser,
  ensureUnblocked,
} from "../../services/access.service.js";

import { matchMember } from "../../services/matchAccess.service.js";
import AppError from "../../utils/AppError.js";

export async function access(id, user) {
  const conversation = await must(Conversation, id);

  if (conversation.kind === "direct") {
    const included = conversation.participants.some(
      (participant) => same(participant, user),
    );

    if (!included) {
      throw new AppError("Conversation access denied.", 403);
    }

    await ensureUnblocked(
      conversation.participants[0],
      conversation.participants[1],
    );
  } else if (conversation.kind === "team") {
    await member(conversation.team, user);
  } else if (conversation.kind === "match") {
    await matchMember(conversation.match, user);
  } else {
    const team = await must(Team, conversation.team);

    if (
      !same(conversation.requester, user) &&
      !same(team.leader, user)
    ) {
      throw new AppError("Conversation access denied.", 403);
    }

    await ensureUnblocked(
      conversation.requester,
      team.leader,
    );
  }

  return conversation;
}

export async function recipients(conversation) {
  if (conversation.kind === "direct") {
    return conversation.participants;
  }

  if (conversation.kind === "team-inquiry") {
    const team = await must(Team, conversation.team);
    return [conversation.requester, team.leader];
  }

  let teams = [conversation.team];

  if (conversation.kind === "match") {
    const match = await must(Match, conversation.match);
    teams = [match.homeTeam, match.awayTeam];
  }

  return Membership.find({
    team: { $in: teams },
  }).distinct("user");
}

export async function create(user, data) {
  let fields;

  if (data.kind === "direct") {
    if (same(user._id, data.userId)) {
      throw new AppError("Choose another player.", 400);
    }

    await activeUser(data.userId);
    await ensureUnblocked(user._id, data.userId);

    const participants = [
      String(user._id),
      data.userId,
    ].sort();

    fields = {
      kind: "direct",
      participants,
      key: `direct:${participants.join(":")}`,
    };
  } else {
    const team = await must(Team, data.teamId);

    await ensureUnblocked(user._id, team.leader);

    if (same(user._id, team.leader)) {
      throw new AppError("Use the team conversation.", 400);
    }

    fields = {
      kind: "team-inquiry",
      team: team._id,
      requester: user._id,
      key: `inquiry:${team.id}:${user.id}`,
    };
  }

  try {
    return await Conversation.findOneAndUpdate(
      { key: fields.key },
      { $setOnInsert: fields },
      { upsert: true, new: true },
    );
  } catch (error) {
    if (error.code === 11000) {
      return Conversation.findOne({ key: fields.key });
    }

    throw error;
  }
}

export async function list(user, query) {
  const teams = await Membership.find({
    user: user._id,
  }).distinct("team");

  const led = await Team.find({
    leader: user._id,
  }).distinct("_id");

  const matches = await Match.find({
    $or: [
      { homeTeam: { $in: teams } },
      { awayTeam: { $in: teams } },
    ],
  }).distinct("_id");

  return Conversation.find({
    $or: [
      { kind: "direct", participants: user._id },
      { kind: "team", team: { $in: teams } },
      { kind: "match", match: { $in: matches } },
      { kind: "team-inquiry", requester: user._id },
      { kind: "team-inquiry", team: { $in: led } },
    ],
  })
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}
import Match from "./match.model.js";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";

import {
  tx,
  same,
} from "../../services/access.service.js";

import {
  matchMember,
  matchLeader,
  lockMatch,
  ensureFree,
  future,
} from "../../services/matchAccess.service.js";

import { notify } from "../notifications/notification.service.js";
import AppError from "../../utils/AppError.js";

export async function list(user, query) {
  const ids = await Membership.find({
    user: user._id,
  }).distinct("team");

  return Match.find({
    $or: [
      { homeTeam: { $in: ids } },
      { awayTeam: { $in: ids } },
    ],
  })
    .sort({ startsAt: 1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export const detail = (user, id) =>
  matchMember(id, user._id);

export const propose = (user, id, data) => tx(async () => {
  const match = await lockMatch(id);
  const team = await matchLeader(match, user._id);

  if (
    match.status !== "scheduled" ||
    match.startsAt <= new Date()
  ) {
    throw new AppError(
      "Only future scheduled matches can be rescheduled.",
      409,
    );
  }

  if (match.scheduleProposal) {
    throw new AppError(
      "Resolve the existing schedule proposal first.",
      409,
    );
  }

  future(data.startsAt);

  await ensureFree(
    [match.homeTeam, match.awayTeam],
    data.startsAt,
    data.endsAt,
    id,
  );

  match.scheduleProposal = {
    ...data,
    proposedByTeam: team,
  };

  await match.save();

  const other = await Team.findById(
    same(team, match.homeTeam)
      ? match.awayTeam
      : match.homeTeam,
  );

  await notify(
    other.leader,
    "schedule",
    "A match schedule change needs your approval.",
    match._id,
  );

  return match;
});

export const decide = (user, id, decision) => tx(async () => {
  const match = await lockMatch(id);
  const team = await matchLeader(match, user._id);

  if (
    match.status !== "scheduled" ||
    match.startsAt <= new Date() ||
    !match.scheduleProposal
  ) {
    throw new AppError(
      "No actionable schedule proposal.",
      409,
    );
  }

  if (same(team, match.scheduleProposal.proposedByTeam)) {
    throw new AppError(
      "The opposing leader must respond.",
      403,
    );
  }

  if (decision === "accepted") {
    const proposal = match.scheduleProposal;

    future(proposal.startsAt);

    await ensureFree(
      [match.homeTeam, match.awayTeam],
      proposal.startsAt,
      proposal.endsAt,
      id,
    );

    match.startsAt = proposal.startsAt;
    match.endsAt = proposal.endsAt;
    match.venue = proposal.venue;
  }

  match.scheduleProposal = undefined;
  await match.save();

  return match;
});

export const cancel = (user, id) => tx(async () => {
  const match = await lockMatch(id);

  await matchLeader(match, user._id);

  if (
    match.status !== "scheduled" ||
    match.startsAt <= new Date()
  ) {
    throw new AppError(
      "Only future scheduled matches can be cancelled.",
      409,
    );
  }

  match.status = "cancelled";
  match.scheduleProposal = undefined;

  await match.save();

  return match;
});
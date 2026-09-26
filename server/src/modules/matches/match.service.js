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
import { replaceReminders, cancelReminders } from "./reminder.service.js";
import { AvailabilityPoll } from "./availabilityPoll.model.js";
import Attendance from "../attendance/attendance.model.js";

export async function upcoming(user) {
  const teamIds = await Membership.find({ user: user._id }).distinct("team");
  if (!teamIds.length) return null;
  const now = new Date();
  const match = await Match.findOne({
    status: "scheduled",
    startsAt: { $gt: now },
    $or: [{ homeTeam: { $in: teamIds } }, { awayTeam: { $in: teamIds } }],
  }).sort({ startsAt: 1, _id: 1 }).lean();
  if (!match) return null;
  const [teams, attendance] = await Promise.all([
    Team.find({ _id: { $in: [match.homeTeam, match.awayTeam] } }).select("name").lean(),
    Attendance.findOne({ match: match._id, user: user._id }).select("response").lean(),
  ]);
  const byId = new Map(teams.map((team) => [String(team._id), team]));
  return {
    _id: match._id,
    startsAt: match.startsAt,
    endsAt: match.endsAt,
    status: match.status,
    venue: match.venue,
    sport: match.sport,
    homeTeam: byId.get(String(match.homeTeam)) || null,
    awayTeam: byId.get(String(match.awayTeam)) || null,
    attendanceStatus: attendance?.response || null,
  };
}

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

export const setReminders = (user, id, offsetsMinutes) => tx(async () => {
  const match = await lockMatch(id);
  await matchLeader(match, user._id);
  if (match.status !== "scheduled" || match.startsAt <= new Date()) throw new AppError("Only future scheduled matches can change reminders.", 409);
  match.reminderOffsetsMinutes = offsetsMinutes;
  match.reminderRevision += 1;
  await match.save();
  await replaceReminders(match);
  return match;
});

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
    revision: match.revision,
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
    "match",
    `match:${match._id}:schedule-proposed:${match.scheduleProposal.revision}`,
    `/matches/${match._id}`,
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

  const proposal = match.scheduleProposal;
  const proposer = await Team.findById(proposal.proposedByTeam);

  if (decision === "accepted") {
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
    match.scheduleRevision += 1;
    match.reminderRevision += 1;
  }

  match.scheduleProposal = undefined;
  await match.save();

  if (decision === "accepted") {
    await AvailabilityPoll.updateMany({ match: match._id, status: "open" }, { $set: { status: "closed" } });
    await replaceReminders(match);
    const players = await Membership.find({ team: { $in: [match.homeTeam, match.awayTeam] } }).distinct("user");
    for (const player of players) await notify(player, "match-schedule", "The match time has changed.", match._id, "match", `match:${match._id}:rescheduled:${match.scheduleRevision}:${player}`, `/matches/${match._id}`);
  }

  await notify(
    proposer.leader,
    "schedule",
    decision === "accepted" ? "Your match schedule change was approved." : "Your match schedule change was declined.",
    match._id,
    "match",
    `match:${match._id}:schedule-${decision}:${proposal.revision}`,
    `/matches/${match._id}`,
  );

  return match;
});

export const cancel = (user, id) => tx(async () => {
  const match = await lockMatch(id);

  const team = await matchLeader(match, user._id);

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
  await cancelReminders(match._id);
  await AvailabilityPoll.updateMany({ match: match._id, status: "open" }, { $set: { status: "closed" } });

  const otherTeam = await Team.findById(same(team._id, match.homeTeam) ? match.awayTeam : match.homeTeam);
  await notify(
    otherTeam.leader,
    "match",
    "A scheduled match has been cancelled.",
    match._id,
    "match",
    `match:${match._id}:cancelled`,
    `/matches/${match._id}`,
  );

  return match;
});

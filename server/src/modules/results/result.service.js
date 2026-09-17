import Result from "./result.model.js";

import {
  tx,
  same,
  must,
} from "../../services/access.service.js";

import {
  lockMatch,
  matchLeader,
  matchMember,
} from "../../services/matchAccess.service.js";

import AppError from "../../utils/AppError.js";

export async function get(user, matchId) {
  await matchMember(matchId, user._id);
  return Result.findOne({ match: matchId });
}

export const submit = (user, data) => tx(async () => {
  const match = await lockMatch(data.matchId);
  const team = await matchLeader(match, user._id);

  if (
    match.status !== "scheduled" ||
    match.endsAt > new Date()
  ) {
    throw new AppError(
      "Submit results after the scheduled match ends.",
      409,
    );
  }

  const existing = await Result.findOne({
    match: match._id,
  });

  if (existing && existing.status !== "disputed") {
    throw new AppError(
      "Result is already awaiting confirmation or final.",
      409,
    );
  }

  return Result.findOneAndUpdate(
    { match: match._id },
    {
      $set: {
        submittedByTeam: team,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        notes: data.notes,
        status: "pending",
      },
    },
    { upsert: true, new: true, runValidators: true },
  );
});

export const decide = (user, id, decision) => tx(async () => {
  const result = await must(Result, id);
  const match = await lockMatch(result.match);
  const team = await matchLeader(match, user._id);

  if (
    result.status !== "pending" ||
    match.status !== "scheduled"
  ) {
    throw new AppError(
      "Result is not awaiting confirmation.",
      409,
    );
  }

  if (same(result.submittedByTeam, team)) {
    throw new AppError(
      "The opposing leader must confirm or dispute.",
      403,
    );
  }

  result.status = decision;
  await result.save();

  if (decision === "confirmed") {
    match.status = "completed";
    await match.save();
  }

  return result;
});
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
import { cancelReminders } from "../matches/reminder.service.js";
import { AvailabilityPoll } from "../matches/availabilityPoll.model.js";

export async function get(user, matchId) {
  await matchMember(matchId, user._id);
  return Result.findOne({ match: matchId });
}

export const submit = (user, data) => tx(async () => {
  const match = await lockMatch(data.matchId);
  const team = await matchLeader(match, user._id);

  if (match.status === "scheduled" && match.endsAt > new Date()) {
    throw new AppError(
      "Submit results after the scheduled match ends.",
      409,
    );
  }

  if (match.status === "completed") {
    const confirmed = await Result.findOne({ match: match._id, status: "confirmed" });
    if (!confirmed || confirmed.correctionProposal) throw new AppError("A score correction is already pending or the result is not confirmed.", 409);
    confirmed.correctionProposal = {
      proposedByTeam: team,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      notes: data.notes,
    };
    await confirmed.save();
    return confirmed;
  }

  if (match.status !== "scheduled") throw new AppError("This match cannot accept a result.", 409);

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

  if (result.correctionProposal) {
    if (result.status !== "confirmed" || match.status !== "completed") throw new AppError("Correction is not actionable.", 409);
    if (same(result.correctionProposal.proposedByTeam, team)) throw new AppError("The opposing team leader must review this correction.", 403);
    if (decision === "confirmed") {
      result.homeScore = result.correctionProposal.homeScore;
      result.awayScore = result.correctionProposal.awayScore;
      result.notes = result.correctionProposal.notes;
      result.correctionCount += 1;
      result.confirmedAt = new Date();
    }
    result.correctionProposal = undefined;
    await result.save();
    return result;
  }

  if (result.status !== "pending" || match.status !== "scheduled") {
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
  if (decision === "confirmed") result.confirmedAt = new Date();
  await result.save();

  if (decision === "confirmed") {
    match.status = "completed";
    await match.save();
    await cancelReminders(match._id);
    await AvailabilityPoll.updateMany({ match: match._id, status: "open" }, { $set: { status: "closed" } });
  }

  return result;
});

import Challenge from "./challenge.model.js";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";
import Match from "../matches/match.model.js";
import Conversation from "../conversations/conversation.model.js";

import {
  tx,
  must,
  leader,
  lockTeams,
  same,
  activeUser,
  ensureUnblocked,
} from "../../services/access.service.js";

import {
  ensureFree,
  future,
} from "../../services/matchAccess.service.js";

import { notify } from "../notifications/notification.service.js";
import AppError from "../../utils/AppError.js";

export const create = (user, data) =>
  tx(async () => {
    await lockTeams([data.fromTeam, data.toTeam]);

    const from = await leader(data.fromTeam, user._id);
    const to = await must(Team, data.toTeam);

    if (same(from._id, to._id)) {
      throw new AppError("Choose two different teams.", 400);
    }

    if (!same(from.sport, to.sport)) {
      throw new AppError(
        "Both teams must play the same sport.",
        400,
      );
    }

    if (same(from.leader, to.leader)) {
      throw new AppError(
        "You cannot challenge another team you lead.",
        409,
      );
    }

    await activeUser(to.leader);
    await ensureUnblocked(from.leader, to.leader);

    future(data.schedule.startsAt);

    await ensureFree(
      [from._id, to._id],
      data.schedule.startsAt,
      data.schedule.endsAt,
    );

    const duplicate = await Challenge.exists({
      status: "pending",

      $or: [
        {
          fromTeam: from._id,
          toTeam: to._id,
        },
        {
          fromTeam: to._id,
          toTeam: from._id,
        },
      ],

      startsAt: {
        $lt: new Date(data.schedule.endsAt),
      },

      endsAt: {
        $gt: new Date(data.schedule.startsAt),
      },
    });

    if (duplicate) {
      throw new AppError(
        "These teams already have a pending challenge at this time.",
        409,
      );
    }

    const challenge = await Challenge.create({
      fromTeam: from._id,
      toTeam: to._id,
      createdBy: user._id,
      ...data.schedule,
    });

    await notify(
      to.leader,
      "challenge",
      `${from.name} challenged your team to a match.`,
      challenge._id,
    );

    return challenge;
  });

export async function list(user, query) {
  const teams = await Membership.find({
    user: user._id,
  }).distinct("team");

  return Challenge.find({
    $or: [
      {
        fromTeam: { $in: teams },
      },
      {
        toTeam: { $in: teams },
      },
    ],
  })
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export const decide = (user, id, decision) =>
  tx(async () => {
    if (!["accepted", "declined", "cancelled"].includes(decision)) {
      throw new AppError("Invalid challenge decision.", 400);
    }

    const current = await must(Challenge, id);

    await lockTeams([
      current.fromTeam,
      current.toTeam,
    ]);

    const challenge = await must(Challenge, id);
    const from = await must(Team, challenge.fromTeam);
    const to = await must(Team, challenge.toTeam);

    const decisionLeader =
      decision === "cancelled"
        ? from.leader
        : to.leader;

    if (!same(decisionLeader, user._id)) {
      throw new AppError(
        decision === "cancelled"
          ? "Only the sending team leader can cancel this challenge."
          : "Only the receiving team leader can accept or decline this challenge.",
        403,
      );
    }

    if (challenge.status !== "pending") {
      throw new AppError(
        "Challenge has already been handled or expired.",
        409,
      );
    }

    future(challenge.startsAt);

    if (decision === "accepted") {
      if (
        !same(from.sport, to.sport) ||
        same(from.leader, to.leader)
      ) {
        throw new AppError(
          "The teams must share a sport and have different leaders.",
          409,
        );
      }

      await activeUser(from.leader);
      await activeUser(to.leader);
      await ensureUnblocked(from.leader, to.leader);

      // Recheck availability when accepting:
      // another match may have been scheduled since creation.
      await ensureFree(
        [from._id, to._id],
        challenge.startsAt,
        challenge.endsAt,
      );

      const match = await Match.create({
        challenge: challenge._id,
        homeTeam: from._id,
        awayTeam: to._id,
        sport: from.sport,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        venue: challenge.venue,
      });

      await Conversation.create({
        kind: "match",
        match: match._id,
        key: `match:${match._id}`,
      });

      for (const recipient of [from.leader, to.leader]) {
        await notify(
          recipient,
          "match",
          `${from.name} vs ${to.name} has been scheduled.`,
          match._id,
        );
      }
    } else {
      await notify(
        decision === "cancelled"
          ? to.leader
          : from.leader,
        "challenge",
        `Challenge ${decision}.`,
        challenge._id,
      );
    }

    challenge.status = decision;
    await challenge.save();

    return challenge;
  });
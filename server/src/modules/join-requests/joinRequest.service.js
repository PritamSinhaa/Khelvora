import JoinRequest from "./joinRequest.model.js";
import Team from "../teams/team.model.js";
import Membership from "../memberships/membership.model.js";

import {
  tx,
  lockTeams,
  must,
  leader,
  same,
  addMember,
  ensureUnblocked,
} from "../../services/access.service.js";

import { notify } from "../notifications/notification.service.js";
import AppError from "../../utils/AppError.js";

export const create = (user, data) =>
  tx(async () => {
    await lockTeams([data.teamId]);

    const team = await must(Team, data.teamId);

    await ensureUnblocked(user._id, team.leader);

    if (!team.lookingForPlayers || team.memberCount >= team.maxMembers) {
      throw new AppError("Team is not recruiting.", 409);
    }

    if (
      await Membership.exists({
        team: team._id,
        user: user._id,
      })
    ) {
      throw new AppError("Already a member.", 409);
    }

    const request = await JoinRequest.create({
      team: team._id,
      user: user._id,
      message: data.message,
    });

    await notify(
      team.leader,
      "join-request",
      `${user.name} requested to join your team.`,
      request._id,
      "request",
      `join-request:${request._id}:created`,
      `/teams/${team._id}`,
    );

    return request;
  });

export async function list(user, query) {
  if (query.teamId) {
    await leader(query.teamId, user._id);
  }

  const filter = query.teamId ? { team: query.teamId } : { user: user._id };

  return JoinRequest.find(filter)
    .populate("user", "name avatarUrl")
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export const decide = (user, id, decision) =>
  tx(async () => {
    const request = await must(JoinRequest, id);

    await lockTeams([request.team]);

    if (request.status !== "pending") {
      throw new AppError("Request already handled.", 409);
    }

    if (decision === "cancelled") {
      if (!same(request.user, user._id)) {
        throw new AppError("Permission denied.", 403);
      }
    } else {
      await leader(request.team, user._id);
      await ensureUnblocked(request.user, user._id);
    }

    if (decision === "accepted") {
      await addMember(request.team, request.user);
    }

    request.status = decision;
    await request.save();

    if (decision === "cancelled") {
      const team = await must(Team, request.team);
      await notify(
        team.leader,
        "join-request",
        `${user.name} cancelled their request to join ${team.name}.`,
        request._id,
        "team",
        `join-request:${request._id}:cancelled`,
        `/teams/${team._id}`,
      );
    } else {
      await notify(
        request.user,
        "join-request",
        `Your request to join the team was ${decision}.`,
        request._id,
        "team",
        `join-request:${request._id}:${decision}`,
        `/teams/${request.team}`,
      );
    }

    return request;
  });

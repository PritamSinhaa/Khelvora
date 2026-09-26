import Invitation from "./invitation.model.js";
import Membership from "../memberships/membership.model.js";
import Team from "../teams/team.model.js";

import {
  tx,
  lockTeams,
  must,
  leader,
  same,
  addMember,
  activeUser,
  ensureUnblocked,
} from "../../services/access.service.js";

import { notify } from "../notifications/notification.service.js";
import AppError from "../../utils/AppError.js";

export const create = (user, data) =>
  tx(async () => {
    await lockTeams([data.teamId]);

    const team = await leader(
      data.teamId,
      user._id,
    );

    await activeUser(data.userId);
    await ensureUnblocked(user._id, data.userId);

    const alreadyMember = await Membership.exists({
      team: team._id,
      user: data.userId,
    });

    if (alreadyMember) {
      throw new AppError("Already a member.", 409);
    }

    await Invitation.updateMany(
      {
        team: team._id,
        user: data.userId,
        status: "pending",

        expiresAt: {
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "expired",
        },
      },
    );

    const invite = await Invitation.create({
      team: team._id,
      user: data.userId,
      invitedBy: user._id,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });

    await notify(
      data.userId,
      "invitation",
      `You were invited to ${team.name}.`,
      invite._id,
      "invitation",
      `invitation:${invite._id}:created`,
      `/teams?invitation=${invite._id}`,
    );

    return invite;
  });

export async function list(user, query) {
  if (query.teamId) {
    await leader(query.teamId, user._id);
  }

  return Invitation.find(
    query.teamId
      ? {
          team: query.teamId,
        }
      : {
          user: user._id,
        },
  )
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export const decide = (user, id, decision) =>
  tx(async () => {
    const invite = await must(Invitation, id);

    await lockTeams([invite.team]);

    if (
      invite.status !== "pending" ||
      invite.expiresAt <= new Date()
    ) {
      throw new AppError(
        "Invitation is no longer available.",
        409,
      );
    }

    if (decision === "cancelled") {
      await leader(invite.team, user._id);
    } else {
      if (!same(invite.user, user._id)) {
        throw new AppError("Permission denied.", 403);
      }

      await ensureUnblocked(
        user._id,
        invite.invitedBy,
      );
    }

    if (decision === "accepted") {
      const team = await must(Team, invite.team);

      await activeUser(team.leader);

      await ensureUnblocked(
        user._id,
        team.leader,
      );

      await addMember(
        invite.team,
        user._id,
      );
    }

    invite.status = decision;
    await invite.save();

    const team = await must(Team, invite.team);
    if (decision !== "cancelled") {
      await notify(invite.invitedBy, "invitation", `${user.name} ${decision} your invitation to ${team.name}.`, invite._id, "team", `invitation:${invite._id}:${decision}`, `/teams/${team._id}`);
    } else {
      await notify(invite.user, "invitation", `${team.name} withdrew your team invitation.`, invite._id, "team", `invitation:${invite._id}:cancelled`, `/teams/${team._id}`);
    }

    return invite;
  });

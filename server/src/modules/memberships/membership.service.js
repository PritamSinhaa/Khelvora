import Membership from "./membership.model.js";
import Team from "../teams/team.model.js";
import AppError from "../../utils/AppError.js";

import {
  tx,
  lockTeams,
  member,
  leader,
  must,
  same,
} from "../../services/access.service.js";

export async function list(user, id, query) {
  await member(id, user._id);

  return Membership.find({ team: id })
    .populate("user", "name avatarUrl")
    .sort({ _id: 1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
}

export const leave = (user, id) =>
  tx(async () => {
    await lockTeams([id]);

    const team = await must(Team, id);

    if (same(team.leader, user._id)) {
      throw new AppError("Transfer leadership before leaving.", 409);
    }

    const removed = await Membership.deleteOne({
      team: id,
      user: user._id,
    });

    if (removed.deletedCount) {
      await Team.updateOne({ _id: id }, { $inc: { memberCount: -1 } });
    }

    return { left: true };
  });

export const remove = (user, id) =>
  tx(async () => {
    const membership = await must(Membership, id);

    await lockTeams([membership.team]);

    const team = await leader(membership.team, user._id);

    if (same(team.leader, membership.user)) {
      throw new AppError("Cannot remove the team leader.", 409);
    }

    const removed = await Membership.deleteOne({ _id: id });

    if (removed.deletedCount) {
      await Team.updateOne({ _id: team._id }, { $inc: { memberCount: -1 } });
    }

    return { removed: true };
  });

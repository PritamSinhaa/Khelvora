import Team from "./team.model.js";
import Membership from "../memberships/membership.model.js";
import Conversation from "../conversations/conversation.model.js";
import Upload from "../uploads/upload.model.js";

import {
  tx,
  leader,
  lockTeams,
  member,
  sportExists,
  activeUser,
  must,
} from "../../services/access.service.js";

import {
  pageOptions,
  escapeRegex,
} from "../../utils/http.js";

import AppError from "../../utils/AppError.js";
import { teamStats, teamHistory } from "../statistics/statistics.service.js";

export function list(query) {
  const filter = {
    ...(query.sport ? { sport: query.sport } : {}),
    ...(query.q
      ? { name: { $regex: escapeRegex(query.q), $options: "i" } }
      : {}),
  };

  return Team.find(filter)
    .populate("sport")
    .select("-location")
    .sort({ _id: -1 })
    .skip(pageOptions(query).skip)
    .limit(query.limit);
}

export const detail = (id) => must(Team, id);

export async function mine(user) {
  const ids = await Membership.find({
    user: user._id,
  }).distinct("team");

  return Team.find({ _id: { $in: ids } }).populate("sport");
}

export const create = (user, data) => tx(async () => {
  await sportExists(data.sport);

  const team = await Team.create({
    ...data,
    leader: user._id,
  });

  await Membership.create({
    team: team._id,
    user: user._id,
  });

  await Conversation.create({
    kind: "team",
    team: team._id,
    key: `team:${team.id}`,
  });

  return team;
});

export const update = (user, id, data) => tx(async () => {
  await lockTeams([id]);

  const team = await leader(id, user._id);

  if (
    data.maxMembers !== undefined &&
    data.maxMembers < team.memberCount
  ) {
    throw new AppError(
      "Capacity cannot be below member count.",
      409,
    );
  }

  Object.assign(team, data);
  await team.save();

  return team;
});

export const transfer = (user, id, target) => tx(async () => {
  await lockTeams([id]);

  const team = await leader(id, user._id);

  await member(id, target);
  await activeUser(target);

  team.leader = target;
  await team.save();

  return team;
});

export const stats = teamStats;
export const history = teamHistory;
export const setCover = (user, teamId, uploadId) =>
  tx(async () => {
    await lockTeams([teamId]);

    // Only the current team leader can change the cover.
    const team = await leader(teamId, user._id);

    // The leader must own the uploaded image.
    const upload = await Upload.findOne({
      _id: uploadId,
      owner: user._id,
    });

    if (!upload) {
      throw new AppError("Upload not found.", 404);
    }

    team.coverUrl = upload.url;
    await team.save();

    return team;
  });

import mongoose from "mongoose";

import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import PlayerSport from "../player-sports/playerSport.model.js";
import Membership from "../memberships/membership.model.js";
import Block from "../blocks/block.model.js";

import AppError from "../../utils/AppError.js";
import { escapeRegex } from "../../utils/http.js";
import { rankCursor, scoreRecommendation } from "./recommendation.js";
import { createAvailabilityMatcher } from "./availability.js";

const DEFAULT_RADIUS_KM = 10;

async function options(user, query, { allowMissingLocation = false } = {}) {
  const coordinates = query.longitude === undefined
    ? user.location?.coordinates || null
    : [query.longitude, query.latitude];

  if (!coordinates && !allowMissingLocation) {
    throw new AppError("Set your profile location or provide longitude and latitude.", 400);
  }

  const sports = query.sport
    ? [new mongoose.Types.ObjectId(query.sport)]
    : await PlayerSport.find({ user: user._id }).distinct("sport");

  if (!sports.length) throw new AppError("Select at least one sport in your profile.", 400);
  return { coordinates, sports };
}

function geo(coordinates, query, filter) {
  return {
    $geoNear: {
      near: { type: "Point", coordinates },
      distanceField: "distanceMeters",
      maxDistance: (query.radiusKm ?? DEFAULT_RADIUS_KM) * 1000,
      spherical: true,
      query: filter,
    },
  };
}

function baseTeamFilter(query, sports, excludedLeaders) {
  return {
    sport: { $in: sports },
    leader: { $nin: excludedLeaders },
    ...(query.q ? { name: { $regex: escapeRegex(query.q), $options: "i" } } : {}),
    ...(query.skillLevel ? { skillLevel: query.skillLevel } : {}),
    ...(query.recruiting !== undefined ? { lookingForPlayers: query.recruiting === "true" } : {}),
  };
}

function removePrivateFields(row) {
  const {
    location: _location,
    distanceMeters: _distanceMeters,
    availabilityProfiles: _availabilityProfiles,
    rankingDistance: _rankingDistance,
    rankingId: _rankingId,
    ...publicRow
  } = row;
  return publicRow;
}

async function blockedIds(user) {
  const blocks = await Block.find({ $or: [{ owner: user._id }, { target: user._id }] }).select("owner target");
  return [user._id, ...blocks.map((block) => String(block.owner) === user.id ? block.target : block.owner)];
}

async function viewerProfiles(user, sports) {
  return PlayerSport.find({ user: user._id, sport: { $in: sports } })
    .select("sport skillLevel availability timeZone")
    .lean();
}

function candidateScorer(row, profiles, coordinates, radiusKm, kind, now, availabilityMatch) {
  const targets = kind === "teams"
    ? (row.availabilityProfiles?.length
      ? row.availabilityProfiles
      : [{ sport: row.sport, skillLevel: row.skillLevel, availability: [], timeZone: "UTC" }])
    : row.profiles;
  const targetSports = kind === "teams" ? [row.sport] : [...new Map((targets || []).map((profile) => [String(profile.sport), profile.sport])).values()];
  const results = targetSports.map((sport) => scoreRecommendation({
      viewerProfiles: profiles,
      targetProfiles: (targets || []).filter((profile) => String(profile.sport) === String(sport)),
      targetSkill: kind === "teams" ? row.skillLevel : undefined,
      sport,
      viewerLocation: coordinates ? { coordinates } : null,
      targetLocation: row.location,
      radiusKm: radiusKm ?? 100,
      now,
      availabilityMatch,
    }));
  const result = results.sort((first, second) => {
    if (first.score !== second.score) return second.score - first.score;
    const firstReasons = first.reasons.join("|");
    const secondReasons = second.reasons.join("|");
    return firstReasons < secondReasons ? -1 : firstReasons > secondReasons ? 1 : 0;
  })[0]
    || { score: 0, reasons: [], distanceKm: null, approximateDistanceKm: null };
  const distanceKm = result.approximateDistanceKm;
  const entity = kind === "players"
    ? { _id: row._id, name: row.name, avatarUrl: row.avatarUrl, bio: row.bio, city: row.city }
    : removePrivateFields(row);
  return {
    ...entity,
    distanceKm,
    distanceApproximate: true,
    recommendationScore: result.score,
    recommendationReasons: result.reasons,
    _rankingDistance: result.distanceKm ?? Number.POSITIVE_INFINITY,
    _rankingId: row._id,
  };
}

async function recommendations(user, query, kind) {
  const { coordinates, sports } = await options(user, query, { allowMissingLocation: true });
  const viewer = await viewerProfiles(user, sports);
  const now = new Date();
  const availabilityMatch = createAvailabilityMatcher(viewer, now);
  const excluded = await blockedIds(user);
  const regexFilter = query.q
    ? { name: { $regex: escapeRegex(query.q), $options: "i" } }
    : {};
  let pipeline;

  if (kind === "teams") {
    const filter = baseTeamFilter(query, sports, excluded);
    if (query.radiusKm !== undefined && !coordinates) return { items: [], total: 0, page: query.page, limit: query.limit };
    pipeline = [
      ...(coordinates && query.radiusKm !== undefined
        ? [geo(coordinates, query, filter)]
        : [{ $match: filter }]),
      {
        $lookup: {
          from: User.collection.name,
          let: { leaderId: "$leader" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$_id", "$$leaderId"] }, { $eq: ["$isActive", true] }] } } },
            { $project: { _id: 1 } },
          ],
          as: "activeLeader",
        },
      },
      { $match: { "activeLeader.0": { $exists: true } } },
      { $lookup: { from: Membership.collection.name, localField: "_id", foreignField: "team", as: "teamMembers" } },
      { $match: { "teamMembers.user": { $ne: user._id } } },
      {
        $lookup: {
          from: PlayerSport.collection.name,
          let: { memberIds: "$teamMembers.user", teamSport: "$sport" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$sport", "$$teamSport"] }, { $in: ["$user", "$$memberIds"] }] } } },
            { $project: { sport: 1, skillLevel: 1, availability: 1, timeZone: 1 } },
          ],
          as: "availabilityProfiles",
        },
      },
      { $project: { revision: 0, __v: 0, activeLeader: 0, teamMembers: 0 } },
    ];
  } else {
    if (query.radiusKm !== undefined && !coordinates) return { items: [], total: 0, page: query.page, limit: query.limit };
    const profileMatch = {
      sport: { $in: sports },
      ...(query.skillLevel ? { skillLevel: query.skillLevel } : {}),
    };
    const userMatch = { isActive: true, _id: { $nin: excluded }, ...regexFilter };
    if (coordinates && query.radiusKm !== undefined) {
      pipeline = [
        geo(coordinates, { ...query, radiusKm: query.radiusKm }, userMatch),
        {
          $lookup: {
            from: PlayerSport.collection.name,
            let: { candidateId: "$_id" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$user", "$$candidateId"] }, { $in: ["$sport", sports] }, ...(query.skillLevel ? [{ $eq: ["$skillLevel", query.skillLevel] }] : [])] } } },
              { $project: { sport: 1, skillLevel: 1, availability: 1, timeZone: 1 } },
            ],
            as: "profiles",
          },
        },
        { $match: { "profiles.0": { $exists: true } } },
        { $project: { passwordHash: 0, googleId: 0, tokenVersion: 0, __v: 0 } },
      ];
    } else {
      pipeline = [
        { $match: profileMatch },
        {
          $group: {
            _id: "$user",
            profiles: { $push: { sport: "$sport", skillLevel: "$skillLevel", availability: "$availability", timeZone: "$timeZone" } },
          },
        },
        {
          $lookup: {
            from: User.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "candidate",
          },
        },
        { $unwind: "$candidate" },
        {
          $match: {
            "candidate.isActive": true,
            "candidate._id": { $nin: excluded },
            ...(query.q ? { "candidate.name": { $regex: escapeRegex(query.q), $options: "i" } } : {}),
          },
        },
        {
          $project: {
            _id: "$candidate._id", name: "$candidate.name", avatarUrl: "$candidate.avatarUrl",
            bio: "$candidate.bio", city: "$candidate.city", location: "$candidate.location", profiles: 1,
          },
        },
      ];
    }
  }

  const Model = kind === "teams" ? Team : coordinates && query.radiusKm !== undefined ? User : PlayerSport;
  const aggregate = Model.aggregate(pipeline).allowDiskUse(true);
  const cursor = aggregate.cursor({ batchSize: 100 });
  const ranked = await rankCursor(cursor, (row) => {
    const normalized = kind === "players" && Model === User ? { ...row, profiles: row.profiles || [] } : row;
    const scored = candidateScorer(normalized, viewer, coordinates, query.radiusKm, kind, now, availabilityMatch);
    if (query.radiusKm !== undefined && scored._rankingDistance > query.radiusKm) return null;
    return scored;
  }, query.page, query.limit);

  // rankCursor skips ineligible rows only when the score callback explicitly returns null.
  return {
    items: ranked.items.map((item) => {
      const { _rankingDistance, _rankingId, ...publicItem } = item;
      return publicItem;
    }),
    total: ranked.total,
    page: query.page,
    limit: query.limit,
  };
}

export async function teams(user, query) {
  if (query.sort === "recommended") return recommendations(user, query, "teams");
  const { coordinates, sports } = await options(user, query);
  return Team.aggregate([
    geo(coordinates, query, {
      sport: { $in: sports },
      ...(query.q ? { name: { $regex: escapeRegex(query.q), $options: "i" } } : {}),
      ...(query.skillLevel ? { skillLevel: query.skillLevel } : {}),
      ...(query.recruiting !== undefined ? { lookingForPlayers: query.recruiting === "true" } : {}),
    }),
    { $skip: (query.page - 1) * query.limit },
    { $limit: query.limit },
    { $addFields: { distanceKm: { $round: [{ $divide: ["$distanceMeters", 1000] }, 1] } } },
    { $project: { revision: 0, __v: 0, location: 0, distanceMeters: 0 } },
  ]);
}

export async function players(user, query) {
  if (query.sort === "recommended") return recommendations(user, query, "players");
  const { coordinates, sports } = await options(user, query);
  const ids = await PlayerSport.find({ sport: { $in: sports }, ...(query.skillLevel ? { skillLevel: query.skillLevel } : {}) }).distinct("user");
  const excluded = await blockedIds(user);
  return User.aggregate([
    geo(coordinates, query, {
      _id: { $in: ids, $nin: excluded },
      isActive: true,
      ...(query.q ? { name: { $regex: escapeRegex(query.q), $options: "i" } } : {}),
    }),
    { $skip: (query.page - 1) * query.limit },
    { $limit: query.limit },
    {
      $project: {
        name: 1, avatarUrl: 1, bio: 1, city: 1,
        distanceKm: { $round: [{ $divide: ["$distanceMeters", 1000] }, 1] },
      },
    },
  ]);
}

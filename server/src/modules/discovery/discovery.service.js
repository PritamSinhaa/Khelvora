import mongoose from "mongoose";

import Team from "../teams/team.model.js";
import User from "../users/user.model.js";
import PlayerSport from "../player-sports/playerSport.model.js";
import Block from "../blocks/block.model.js";

import AppError from "../../utils/AppError.js";
import { escapeRegex } from "../../utils/http.js";

async function options(user, query) {
  const coordinates =
    query.longitude === undefined
      ? user.location?.coordinates
      : [query.longitude, query.latitude];

  if (!coordinates) {
    throw new AppError(
      "Set your profile location or provide longitude and latitude.",
      400,
    );
  }

  const sports = query.sport
    ? [new mongoose.Types.ObjectId(query.sport)]
    : await PlayerSport.find({
        user: user._id,
      }).distinct("sport");

  if (!sports.length) {
    throw new AppError("Select at least one sport in your profile.", 400);
  }

  return {
    coordinates,
    sports,
  };
}

function geo(coordinates, query, filter) {
  return {
    $geoNear: {
      near: {
        type: "Point",
        coordinates,
      },

      distanceField: "distanceMeters",
      maxDistance: query.radiusKm * 1000,
      spherical: true,
      query: filter,
    },
  };
}

export async function teams(user, query) {
  const { coordinates, sports } = await options(user, query);

  return Team.aggregate([
    geo(coordinates, query, {
      sport: {
        $in: sports,
      },

      ...(query.q
        ? {
            name: {
              $regex: escapeRegex(query.q),
              $options: "i",
            },
          }
        : {}),

      ...(query.skillLevel
        ? {
            skillLevel: query.skillLevel,
          }
        : {}),

      ...(query.recruiting
        ? {
            lookingForPlayers: query.recruiting === "true",
          }
        : {}),
    }),

    {
      $skip: (query.page - 1) * query.limit,
    },

    {
      $limit: query.limit,
    },

    {
      $project: {
        revision: 0,
        __v: 0,
      },
    },
  ]);
}

export async function players(user, query) {
  const { coordinates, sports } = await options(user, query);

  const ids = await PlayerSport.find({
    sport: {
      $in: sports,
    },

    ...(query.skillLevel
      ? {
          skillLevel: query.skillLevel,
        }
      : {}),
  }).distinct("user");

  const blocks = await Block.find({
    $or: [
      {
        owner: user._id,
      },
      {
        target: user._id,
      },
    ],
  });

  const excluded = [
    user._id,

    ...blocks.map((block) =>
      String(block.owner) === user.id ? block.target : block.owner,
    ),
  ];

  return User.aggregate([
    geo(coordinates, query, {
      _id: {
        $in: ids,
        $nin: excluded,
      },

      isActive: true,

      ...(query.q
        ? {
            name: {
              $regex: escapeRegex(query.q),
              $options: "i",
            },
          }
        : {}),
    }),

    {
      $skip: (query.page - 1) * query.limit,
    },

    {
      $limit: query.limit,
    },

    {
      $project: {
        name: 1,
        avatarUrl: 1,
        bio: 1,
        city: 1,

        distanceKm: {
          $round: [
            {
              $divide: ["$distanceMeters", 1000],
            },
            1,
          ],
        },
      },
    },
  ]);
}

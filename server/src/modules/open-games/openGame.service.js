import OpenGame from "./openGame.model.js";

import {
  sportExists,
  must,
  same,
  ensureUnblocked,
} from "../../services/access.service.js";

import { future } from "../../services/matchAccess.service.js";
import AppError from "../../utils/AppError.js";

export const list = (query) =>
  OpenGame.find({
    status: "open",
    startsAt: { $gt: new Date() },
    ...(query.sport ? { sport: query.sport } : {}),
  })
    .sort({ startsAt: 1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);

export async function create(user, data) {
  await sportExists(data.sport);
  future(data.schedule.startsAt);

  return OpenGame.create({
    host: user._id,
    sport: data.sport,
    title: data.title,
    capacity: data.capacity,
    players: [user._id],
    ...data.schedule,
  });
}

export async function join(user, id) {
  const game = await must(OpenGame, id);

  await ensureUnblocked(user._id, game.host);

  const updated = await OpenGame.findOneAndUpdate(
    {
      _id: id,
      status: "open",
      startsAt: { $gt: new Date() },
      players: { $ne: user._id },

      $expr: {
        $lt: [{ $size: "$players" }, "$capacity"],
      },
    },
    { $addToSet: { players: user._id } },
    { new: true },
  );

  if (!updated) {
    throw new AppError(
      "Game is full, closed, or you already joined.",
      409,
    );
  }

  return updated;
}

export async function leave(user, id) {
  const game = await must(OpenGame, id);

  if (same(game.host, user._id)) {
    throw new AppError(
      "The host must cancel instead of leaving.",
      409,
    );
  }

  if (game.startsAt <= new Date()) {
    throw new AppError("Game has already started.", 409);
  }

  return OpenGame.findByIdAndUpdate(
    id,
    { $pull: { players: user._id } },
    { new: true },
  );
}

export async function cancel(user, id) {
  const game = await OpenGame.findOneAndUpdate(
    {
      _id: id,
      host: user._id,
      status: "open",
      startsAt: { $gt: new Date() },
    },
    { $set: { status: "cancelled" } },
    { new: true },
  );

  if (!game) {
    throw new AppError(
      "Only the host can cancel a future open game.",
      403,
    );
  }

  return game;
}
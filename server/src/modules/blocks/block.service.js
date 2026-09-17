import Block from "./block.model.js";

import {
  activeUser,
  same,
} from "../../services/access.service.js";

import AppError from "../../utils/AppError.js";

export const list = (user, query) =>
  Block.find({ owner: user._id })
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);

export async function create(user, target) {
  if (same(user._id, target)) {
    throw new AppError("Cannot block yourself.", 400);
  }

  await activeUser(target);

  return Block.findOneAndUpdate(
    { owner: user._id, target },
    { $setOnInsert: { owner: user._id, target } },
    { upsert: true, new: true },
  );
}

export async function remove(user, target) {
  await Block.deleteOne({
    owner: user._id,
    target,
  });

  return { removed: true };
}
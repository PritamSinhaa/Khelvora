import Report from "./report.model.js";

import {
  activeUser,
  same,
} from "../../services/access.service.js";

import AppError from "../../utils/AppError.js";

export async function create(user, data) {
  if (same(user._id, data.userId)) {
    throw new AppError("Cannot report yourself.", 400);
  }

  await activeUser(data.userId);

  return Report.create({
    reporter: user._id,
    targetUser: data.userId,
    reason: data.reason,
  });
}

export const list = (user, query) =>
  Report.find(
    user.role === "admin" ? {} : { reporter: user._id },
  )
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);

export async function resolve(id, data) {
  const report = await Report.findOneAndUpdate(
    { _id: id, status: "open" },
    { $set: data },
    { new: true },
  );

  if (!report) {
    throw new AppError("Open report not found.", 404);
  }

  return report;
}
import Notification from "./notification.model.js";
import AppError from "../../utils/AppError.js";

export const notify = (user, type, text, entityId) =>
  Notification.create({
    user,
    type,
    text,
    entityId: String(entityId),
  });

export const list = (user, query) =>
  Notification.find({ user: user._id })
    .sort({ _id: -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);

export async function read(user, id) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: user._id },
    { $set: { readAt: new Date() } },
    { new: true },
  );

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  return notification;
}
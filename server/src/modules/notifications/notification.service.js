import Notification from "./notification.model.js";
import AppError from "../../utils/AppError.js";

export async function notify(user, type, text, entityId, targetType = type, deduplicationKey = `${type}:${entityId}`, link = null) {
  const key = String(deduplicationKey);
  try {
    return await Notification.findOneAndUpdate(
      { user, deduplicationKey: key },
      { $setOnInsert: { user, type, text, entityId: String(entityId), targetType, deduplicationKey: key, link } },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Notification.findOne({ user, deduplicationKey: key });
  }
}

export async function list(user, query) {
  const filter = { user: user._id, ...(query.unread ? { readAt: null } : {}) };
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: user._id, readAt: null }),
  ]);
  return { items, total, unreadCount, page: query.page, limit: query.limit };
}

export const unreadCount = (user) => Notification.countDocuments({ user: user._id, readAt: null });

export async function read(user, id) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: user._id },
    { $set: { readAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!notification) throw new AppError("Notification not found.", 404);
  return notification;
}

export const readAll = (user) =>
  Notification.updateMany({ user: user._id, readAt: null }, { $set: { readAt: new Date() } });

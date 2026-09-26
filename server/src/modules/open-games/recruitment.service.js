import { RecruitmentRequest, RecruitmentApplication } from "./recruitment.model.js";
import { sportExists, same, ensureUnblocked, tx } from "../../services/access.service.js";
import { notify } from "../notifications/notification.service.js";
import AppError from "../../utils/AppError.js";
import { remainingPlaces } from "./capacity.js";

function todayRange(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const p = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const midnight = Date.parse(`${p.year}-${p.month}-${p.day}T00:00:00Z`);
    const offset = (at) => {
      const d = new Date(at);
      const local = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d);
      const x = Object.fromEntries(local.map(({ type, value }) => [type, value]));
      return Date.UTC(+x.year, +x.month - 1, +x.day, +x.hour, +x.minute, +x.second) - d.getTime();
    };
    const start = midnight - offset(midnight);
    const next = midnight + 86400000 - offset(midnight + 86400000);
    return { $gte: new Date(start), $lt: new Date(next) };
  } catch {
    throw new AppError("Provide a valid time zone.", 400);
  }
}

export async function list(query, user) {
  await RecruitmentRequest.updateMany({ status: "open", startsAt: { $lte: new Date() } }, { $set: { status: "expired" } });
  const filter = { status: "open", startsAt: { $gt: new Date(), $lt: todayRange(query.timeZone) }, ...(query.sport ? { sport: query.sport } : {}), ...(query.skill && query.skill !== "Any" ? { skillPreference: { $in: [query.skill, "Any"] } } : {}) };
  const items = await RecruitmentRequest.find(filter).populate("sport", "name").populate("organizer", "name avatarUrl").sort({ startsAt: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean();
  const ids = items.map((item) => item._id);
  const apps = ids.length ? await RecruitmentApplication.aggregate([
    { $match: { request: { $in: ids } } },
    { $group: { _id: "$request", pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } } } },
  ]) : [];
  const counts = new Map(apps.map((item) => [String(item._id), item.pending]));
  const mine = await RecruitmentApplication.find({ request: { $in: ids }, user: user._id }).lean();
  const mineByRequest = new Map(mine.map((application) => [String(application.request), application]));
  return items.map((item) => ({ ...item, pendingApplications: counts.get(String(item._id)) || 0, remainingSlots: remainingPlaces(item.slots, item.confirmedPlayers.length), myApplicationStatus: mineByRequest.get(String(item._id))?.status || null, myApplicationId: mineByRequest.get(String(item._id))?._id || null }));
}

export async function create(user, data) {
  await sportExists(data.sport);
  if (new Date(data.startsAt) <= new Date()) throw new AppError("Start time must be in the future.", 400);
  return RecruitmentRequest.create({ organizer: user._id, ...data });
}

export async function apply(user, id) {
  const request = await RecruitmentRequest.findById(id);
  if (!request) throw new AppError("Record not found.", 404);
  if (same(request.organizer, user._id)) throw new AppError("You cannot apply to your own request.", 409);
  await ensureUnblocked(user._id, request.organizer);
  if (request.status !== "open" || request.startsAt <= new Date()) {
    await RecruitmentRequest.updateOne({ _id: id, status: "open", startsAt: { $lte: new Date() } }, { $set: { status: "expired" } });
    throw new AppError("Recruitment is closed or has started.", 409);
  }
  try {
    const application = await RecruitmentApplication.create({ request: id, user: user._id });
    await notify(request.organizer, "join-request", `${user.name} requested to join your game.`, application._id, "request", `urgent-recruitment:${application._id}:created`, "/open-games");
    return application;
  } catch (error) {
    if (error.code === 11000) throw new AppError("You have already applied to this request.", 409);
    throw error;
  }
}

export async function applications(user, id) {
  const request = await RecruitmentRequest.findById(id);
  if (!request) throw new AppError("Record not found.", 404);
  if (!same(request.organizer, user._id)) throw new AppError("Permission denied.", 403);
  return RecruitmentApplication.find({ request: id }).populate("user", "name avatarUrl").sort({ createdAt: 1 });
}

export async function decide(user, id, decision) {
  return tx(async () => {
    const app = await RecruitmentApplication.findById(id);
    if (!app) throw new AppError("Record not found.", 404);
    const request = await RecruitmentRequest.findByIdAndUpdate(app.request, { $inc: { revision: 1 } }, { new: true });
    if (!request) throw new AppError("Record not found.", 404);
    if (!same(request.organizer, user._id)) throw new AppError("Permission denied.", 403);
    if (app.status !== "pending") throw new AppError("Application already handled.", 409);
    if (decision === "accepted") {
      const updated = await RecruitmentRequest.findOneAndUpdate({ _id: request._id, status: "open", startsAt: { $gt: new Date() }, $expr: { $gt: [{ $subtract: ["$slots", { $size: "$confirmedPlayers" }] }, 0] } }, { $addToSet: { confirmedPlayers: app.user } }, { new: true });
      if (!updated) throw new AppError("Recruitment is closed or all places are filled.", 409);
    }
    app.status = decision;
    await app.save();
    await notify(app.user, "join-request", `Your application was ${decision}.`, app._id, "request", `urgent-recruitment:${app._id}:${decision}`, "/open-games");
    return app;
  });
}

export async function cancelApplication(user, id) {
  const app = await RecruitmentApplication.findOneAndUpdate({ _id: id, user: user._id, status: "pending" }, { $set: { status: "cancelled" } }, { new: true });
  if (!app) throw new AppError("Pending application not found.", 404);
  return app;
}

export async function close(user, id) {
  const result = await RecruitmentRequest.findOneAndUpdate({ _id: id, organizer: user._id, status: "open" }, { $set: { status: "closed" } }, { new: true });
  if (!result) throw new AppError("Only the organizer can close an open request.", 403);
  return result;
}

import OpenGame from "./openGame.model.js";
import WaitlistEntry from "./waitlist.model.js";
import { hasPlace, remainingPlaces } from "./capacity.js";
import { activeUser, ensureUnblocked, same, tx } from "../../services/access.service.js";
import { env } from "../../config/env.js";
import { notify } from "../notifications/notification.service.js";
import AppError from "../../utils/AppError.js";

const isLive = (game, now = new Date()) => game?.status === "open" && game.startsAt > now;

async function lockGame(id) {
  const game = await OpenGame.findByIdAndUpdate(id, { $inc: { revision: 1 } }, { returnDocument: "after" });
  if (!game) throw new AppError("Record not found.", 404);
  return game;
}

async function reservations(gameId, now = new Date()) {
  return WaitlistEntry.countDocuments({ game: gameId, status: "offered", active: true, offerExpiresAt: { $gt: now } });
}

async function expireForGame(game, now) {
  const expired = await WaitlistEntry.find({ game: game._id, status: "offered", active: true, offerExpiresAt: { $lte: now } });
  for (const entry of expired) {
    entry.status = "expired";
    entry.active = false;
    entry.handledAt = now;
    await entry.save();
    await notify(entry.user, "game-waitlist", `Your reserved place in ${game.title} expired.`, game._id, "open-game", `open-game:${game._id}:waitlist:${entry._id}:expired`, "/open-games");
  }
}

async function promoteAvailable(game, now = new Date()) {
  if (!isLive(game, now)) return;
  await expireForGame(game, now);
  while (hasPlace(game.capacity, game.players.length, await reservations(game._id, now))) {
    const entry = await WaitlistEntry.findOne({ game: game._id, status: "queued", active: true }).sort({ createdAt: 1, _id: 1 });
    if (!entry) break;
    let eligible = true;
    try {
      await activeUser(entry.user);
      await ensureUnblocked(entry.user, game.host);
    } catch {
      eligible = false;
    }
    if (game.players.some((player) => same(player, entry.user))) eligible = false;
    if (!eligible) {
      entry.status = "cancelled";
      entry.active = false;
      entry.handledAt = now;
      await entry.save();
      continue;
    }
    entry.status = "offered";
    entry.offeredAt = now;
    entry.offerExpiresAt = new Date(now.getTime() + env.openGameWaitlistOfferMinutes * 60000);
    await entry.save();
    await notify(entry.user, "game-waitlist", `A place is available in ${game.title}. Accept within ${env.openGameWaitlistOfferMinutes} minutes to confirm.`, game._id, "open-game", `open-game:${game._id}:waitlist:${entry._id}:offered`, "/open-games");
  }
}

export async function listState(games, user) {
  const ids = games.map((game) => game._id);
  if (!ids.length) return games;
  const now = new Date();
  const [entries, offered] = await Promise.all([
    WaitlistEntry.find({ game: { $in: ids }, user: user._id, active: true }).lean(),
    WaitlistEntry.aggregate([{ $match: { game: { $in: ids }, status: "offered", active: true, offerExpiresAt: { $gt: now } } }, { $group: { _id: "$game", count: { $sum: 1 } } }]),
  ]);
  const queued = await WaitlistEntry.find({ game: { $in: ids }, status: "queued", active: true }).sort({ createdAt: 1, _id: 1 }).select("game user createdAt").lean();
  const ahead = new Map();
  const positions = new Map();
  for (const entry of queued) {
    const key = String(entry.game);
    const rank = (ahead.get(key) || 0) + 1;
    ahead.set(key, rank);
    if (same(entry.user, user._id)) positions.set(key, rank);
  }
  const entryByGame = new Map(entries.map((entry) => [String(entry.game), entry]));
  const offerCounts = new Map(offered.map((item) => [String(item._id), item.count]));
  return games.map((game) => {
    const gameId = String(game._id);
    const reserved = offerCounts.get(gameId) || 0;
    const fields = typeof game.toObject === "function" ? game.toObject() : game;
    return { ...fields, reservationCount: reserved, remainingPlaces: remainingPlaces(game.capacity, game.players.length, reserved), myWaitlistEntry: entryByGame.get(gameId) || null, queuePosition: positions.get(gameId) || null };
  });
}

export async function join(user, gameId) {
  const result = await tx(async () => {
    const game = await lockGame(gameId);
    const now = new Date();
    if (!isLive(game, now)) throw new AppError("Game is closed or has started.", 409);
    if (game.players.some((player) => same(player, user._id))) throw new AppError("You already joined this game.", 409);
    if (await WaitlistEntry.exists({ game: gameId, user: user._id, active: true })) throw new AppError("You already have an active waitlist entry.", 409);
    await activeUser(user._id);
    await ensureUnblocked(user._id, game.host);
    await expireForGame(game, now);
    await promoteAvailable(game, now);
    if (!hasPlace(game.capacity, game.players.length, await reservations(gameId, now))) return { full: true };
    game.players.addToSet(user._id);
    await game.save();
    return { game };
  });
  if (result.full) throw new AppError("Game is full. Join the waitlist instead.", 409);
  return result.game;
}

export async function joinWaitlist(user, gameId) {
  return tx(async () => {
    const game = await lockGame(gameId);
    const now = new Date();
    if (!isLive(game, now)) throw new AppError("Game is closed or has started.", 409);
    if (game.players.some((player) => same(player, user._id))) throw new AppError("You already joined this game.", 409);
    if (await WaitlistEntry.exists({ game: gameId, user: user._id, active: true })) throw new AppError("You already have an active waitlist entry.", 409);
    await activeUser(user._id);
    await ensureUnblocked(user._id, game.host);
    await promoteAvailable(game, now);
    if (hasPlace(game.capacity, game.players.length, await reservations(gameId, now))) throw new AppError("A place is available. Join the game directly.", 409);
    const entry = await WaitlistEntry.create({ game: gameId, user: user._id });
    const ahead = await WaitlistEntry.countDocuments({ game: gameId, status: "queued", active: true, $or: [{ createdAt: { $lt: entry.createdAt } }, { createdAt: entry.createdAt, _id: { $lt: entry._id } }] });
    return { entry, queuePosition: ahead + 1 };
  });
}

export async function leaveWaitlist(user, gameId) {
  return tx(async () => {
    const game = await lockGame(gameId);
    const entry = await WaitlistEntry.findOne({ game: gameId, user: user._id, active: true });
    if (!entry) throw new AppError("No active waitlist entry found.", 404);
    const hadOffer = entry.status === "offered";
    entry.status = "cancelled";
    entry.active = false;
    entry.handledAt = new Date();
    await entry.save();
    if (hadOffer) await promoteAvailable(game);
    return entry;
  });
}

export async function leaveGame(user, gameId) {
  return tx(async () => {
    const game = await lockGame(gameId);
    if (same(game.host, user._id)) throw new AppError("The host must cancel instead of leaving.", 409);
    if (!isLive(game)) throw new AppError("Game has already started or closed.", 409);
    if (!game.players.some((player) => same(player, user._id))) throw new AppError("You have not joined this game.", 409);
    game.players = game.players.filter((player) => !same(player, user._id));
    await game.save();
    await promoteAvailable(game);
    return game;
  });
}

async function resolveOffer(user, gameId, decision) {
  const result = await tx(async () => {
    const game = await lockGame(gameId);
    const now = new Date();
    const entry = await WaitlistEntry.findOne({ game: gameId, user: user._id, status: "offered", active: true });
    if (!entry) throw new AppError("No active place offer found.", 409);
    if (!isLive(game, now)) {
      entry.status = "cancelled";
      entry.active = false;
      entry.handledAt = now;
      await entry.save();
      return { unavailable: true };
    }
    if (entry.offerExpiresAt <= now) {
      entry.status = "expired";
      entry.active = false;
      entry.handledAt = now;
      await entry.save();
      await notify(user._id, "game-waitlist", `Your reserved place in ${game.title} expired.`, game._id, "open-game", `open-game:${game._id}:waitlist:${entry._id}:expired`, "/open-games");
      await promoteAvailable(game, now);
      return { expired: true };
    }
    await activeUser(user._id);
    await ensureUnblocked(user._id, game.host);
    if (decision === "accepted") {
      const reserved = await reservations(gameId, now);
      if (game.players.some((player) => same(player, user._id)) || game.players.length >= game.capacity || reserved < 1 || game.players.length + reserved > game.capacity) throw new AppError("The reserved place is no longer available.", 409);
      game.players.addToSet(user._id);
      await game.save();
      entry.status = "accepted";
    } else {
      entry.status = "declined";
    }
    entry.active = false;
    entry.handledAt = now;
    await entry.save();
    if (decision === "accepted") await notify(user._id, "game-waitlist", `Your place in ${game.title} is confirmed.`, game._id, "open-game", `open-game:${game._id}:waitlist:${entry._id}:confirmed`, "/open-games");
    else await promoteAvailable(game, now);
    return { entry };
  });
  if (result.expired) throw new AppError("The place offer expired. The next player has been offered the place.", 409);
  if (result.unavailable) throw new AppError("Game is closed or has started.", 409);
  return result.entry;
}

export const acceptOffer = (user, gameId) => resolveOffer(user, gameId, "accepted");
export const declineOffer = (user, gameId) => resolveOffer(user, gameId, "declined");

export async function cancelGame(user, gameId) {
  return tx(async () => {
    const game = await lockGame(gameId);
    if (!same(game.host, user._id)) throw new AppError("Only the host can cancel this game.", 403);
    if (!isLive(game)) throw new AppError("Only the host can cancel a future open game.", 403);
    game.status = "cancelled";
    await game.save();
    const entries = await WaitlistEntry.find({ game: gameId, active: true });
    for (const entry of entries) {
      entry.status = "cancelled";
      entry.active = false;
      entry.handledAt = new Date();
      await entry.save();
      await notify(entry.user, "game-waitlist", `${game.title} was cancelled.`, game._id, "open-game", `open-game:${game._id}:waitlist:${entry._id}:game-cancelled`, "/open-games");
    }
    return game;
  });
}

export async function processExpiredOffers(now = new Date()) {
  const expired = await WaitlistEntry.find({ status: "offered", active: true, offerExpiresAt: { $lte: now } }).select("game").limit(100).lean();
  for (const { game: gameId } of expired) await tx(async () => {
    const game = await lockGame(gameId);
    await promoteAvailable(game, now);
  });
  const queued = await WaitlistEntry.find({ active: true }).populate("game", "status startsAt").limit(200);
  for (const entry of queued) if (!isLive(entry.game, now)) {
    entry.status = "cancelled";
    entry.active = false;
    entry.handledAt = now;
    await entry.save();
  }
}

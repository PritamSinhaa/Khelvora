import OpenGame from "./openGame.model.js";
import { sportExists } from "../../services/access.service.js";

import { future } from "../../services/matchAccess.service.js";
import * as waitlist from "./waitlist.service.js";

export async function nearby(user) {
  if (!user.location?.coordinates) return { items: [], total: 0, radiusKm: 25 };
  const now = new Date();
  const candidates = await OpenGame.aggregate([
    { $geoNear: {
      near: user.location,
      distanceField: "distanceMeters",
      maxDistance: 25000,
      spherical: true,
      query: { status: "open", startsAt: { $gt: now } },
    } },
    { $limit: 30 },
  ]);
  const available = (await waitlist.listState(candidates, user))
    .filter((game) => game.remainingPlaces > 0)
    .slice(0, 6);
  return { items: available, total: available.length, radiusKm: 25 };
}

export async function list(user, query) {
  const games = await OpenGame.find({
    status: "open",
    startsAt: { $gt: new Date() },
    ...(query.sport ? { sport: query.sport } : {}),
  })
    .sort({ startsAt: 1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit);
  return waitlist.listState(games, user);
}

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

export const join = waitlist.join;
export const joinWaitlist = waitlist.joinWaitlist;
export const leaveWaitlist = waitlist.leaveWaitlist;
export const acceptOffer = waitlist.acceptOffer;
export const declineOffer = waitlist.declineOffer;

export const leave = waitlist.leaveGame;

export const cancel = waitlist.cancelGame;

import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("open-game waitlist orders players, reserves places, handles races and advances expired offers", async () => {
  const { app, close } = await startTestApp();
  try {
    const { default: Sport } = await import("../../src/modules/sports/sport.model.js");
    const { default: OpenGame } = await import("../../src/modules/open-games/openGame.model.js");
    const WaitlistEntry = (await import("../../src/modules/open-games/waitlist.model.js")).default;
    const { processExpiredOffers } = await import("../../src/modules/open-games/waitlist.service.js");
    const { default: Notification } = await import("../../src/modules/notifications/notification.model.js");
    const { env } = await import("../../src/config/env.js");
    const sport = await Sport.create({ name: "Football", slug: "football", defaultTeamSize: 11 });
    const call = (method, path, account, body) => {
      let action = request(app)[method](`/api/v1${path}`);
      if (account) action = action.set("Authorization", `Bearer ${account.accessToken}`);
      return body ? action.send(body) : action;
    };
    async function register(name) {
      const response = await call("post", "/auth/register", null, { name, email: `${name}@example.com`, password: "a-strong-password-123" });
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return response.body.data;
    }
    async function createGame(host, capacity) {
      const startsAt = new Date(Date.now() + 3 * 3600000);
      const created = await call("post", "/open-games", host, { sport: sport.id, title: "Evening game", capacity, schedule: {
        startsAt: startsAt.toISOString(), endsAt: new Date(+startsAt + 3600000).toISOString(),
        venue: { name: "Ground", address: "Town", location: { type: "Point", coordinates: [76.7, 30.7] } },
      } });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      return created.body.data._id;
    }
    const [host, p1, p2, first, second, third, expHost, expPlayer, expFirst, expSecond] = await Promise.all([
      "host", "playerone", "playertwo", "firstqueue", "secondqueue", "thirdqueue", "exphost", "expplayer", "expiryone", "expirytwo",
    ].map(register));

    const gameId = await createGame(host, 3);
    assert.equal((await call("post", `/open-games/${gameId}/join`, p1)).status, 200);
    assert.equal((await call("post", `/open-games/${gameId}/join`, p1)).status, 409);
    assert.equal((await call("post", `/open-games/${gameId}/join`, p2)).status, 200);
    assert.equal((await call("post", `/open-games/${gameId}/waitlist`, first)).status, 201);
    assert.equal((await call("post", `/open-games/${gameId}/waitlist`, second)).status, 201);
    assert.equal((await call("post", `/open-games/${gameId}/waitlist`, third)).status, 201);
    assert.equal((await call("post", `/open-games/${gameId}/waitlist`, first)).status, 409);
    assert.equal((await call("post", `/open-games/${gameId}/join`, third)).status, 409);
    const list = await call("get", "/open-games?page=1&limit=20", second);
    const game = list.body.data.find((item) => item._id === gameId);
    assert.equal(game.queuePosition, 2);

    const exits = await Promise.all([
      call("post", `/open-games/${gameId}/leave`, p1),
      call("post", `/open-games/${gameId}/leave`, p2),
    ]);
    assert.deepEqual(exits.map((result) => result.status), [200, 200]);
    const offered = await WaitlistEntry.find({ game: gameId, status: "offered" }).sort({ createdAt: 1, _id: 1 });
    assert.deepEqual(offered.map((entry) => String(entry.user)), [first.user.id, second.user.id]);
    assert.ok(offered.every((entry) => entry.offerExpiresAt - entry.offeredAt === env.openGameWaitlistOfferMinutes * 60000));
    assert.equal(await Notification.countDocuments({ type: "game-waitlist", text: /place is available/ }), 2);
    const full = await call("get", "/open-games?page=1&limit=20", third);
    assert.equal(full.body.data.find((item) => item._id === gameId).remainingPlaces, 0);
    const acceptances = await Promise.all([
      call("post", `/open-games/${gameId}/waitlist/accept`, first),
      call("post", `/open-games/${gameId}/waitlist/accept`, second),
    ]);
    assert.deepEqual(acceptances.map((result) => result.status), [200, 200]);
    const acceptedGame = await OpenGame.findById(gameId);
    assert.equal(acceptedGame.players.length, 3);
    assert.equal(await Notification.countDocuments({ type: "game-waitlist", text: /confirmed/ }), 2);
    assert.equal((await call("delete", `/open-games/${gameId}/waitlist`, third)).status, 200);
    assert.equal((await call("post", `/open-games/${gameId}/waitlist`, third)).status, 201);
    assert.equal((await call("post", `/open-games/${gameId}/cancel`, host)).status, 200);
    assert.equal((await WaitlistEntry.findOne({ game: gameId, user: third.user.id, active: true })), null);

    const expiryGame = await createGame(expHost, 2);
    assert.equal((await call("post", `/open-games/${expiryGame}/join`, expPlayer)).status, 200);
    await call("post", `/open-games/${expiryGame}/waitlist`, expFirst);
    await call("post", `/open-games/${expiryGame}/waitlist`, expSecond);
    assert.equal((await call("post", `/open-games/${expiryGame}/leave`, expPlayer)).status, 200);
    const firstOffer = await WaitlistEntry.findOne({ game: expiryGame, user: expFirst.user.id });
    assert.equal(firstOffer.status, "offered");
    await WaitlistEntry.updateOne({ _id: firstOffer._id }, { $set: { offerExpiresAt: new Date(Date.now() - 1000) } });
    await processExpiredOffers();
    assert.equal((await WaitlistEntry.findById(firstOffer._id)).status, "expired");
    assert.equal((await WaitlistEntry.findOne({ game: expiryGame, user: expSecond.user.id })).status, "offered");
    assert.equal(await Notification.countDocuments({ user: expFirst.user.id, type: "game-waitlist", text: /expired/ }), 1);
    assert.equal((await call("post", `/open-games/${expiryGame}/waitlist/accept`, expSecond)).status, 200);
    assert.equal((await OpenGame.findById(expiryGame)).players.length, 2);

    const startedGame = await createGame(expHost, 2);
    assert.equal((await call("post", `/open-games/${startedGame}/join`, expPlayer)).status, 200);
    await call("post", `/open-games/${startedGame}/waitlist`, expFirst);
    await OpenGame.updateOne({ _id: startedGame }, { $set: { startsAt: new Date(Date.now() - 1000) } });
    assert.equal((await call("post", `/open-games/${startedGame}/leave`, expPlayer)).status, 409);
    await processExpiredOffers();
    assert.equal((await WaitlistEntry.findOne({ game: startedGame, user: expFirst.user.id })).status, "cancelled");
  } finally {
    await close();
  }
});

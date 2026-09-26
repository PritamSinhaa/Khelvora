import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("recommendations apply filters, ranking, blocked eligibility, missing data, and stable pages", async () => {
  const { app, close } = await startTestApp();
  try {
    const Sport = (await import("../../src/modules/sports/sport.model.js")).default;
    const User = (await import("../../src/modules/users/user.model.js")).default;
    const Team = (await import("../../src/modules/teams/team.model.js")).default;
    const Membership = (await import("../../src/modules/memberships/membership.model.js")).default;
    const PlayerSport = (await import("../../src/modules/player-sports/playerSport.model.js")).default;
    const Block = (await import("../../src/modules/blocks/block.model.js")).default;

    const call = (method, path, token, body) => {
      const action = request(app)[method](`/api/v1${path}`);
      if (token) action.set("Authorization", `Bearer ${token}`);
      return body ? action.send(body) : action;
    };
    async function register(name) {
      const response = await call("post", "/auth/register", null, {
        name, email: `${name}@example.com`, password: "a-strong-password-123",
      });
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return response.body.data;
    }

    const sport = await Sport.create({ name: "Football", slug: "football", defaultTeamSize: 11 });
    const basketball = await Sport.create({ name: "Basketball", slug: "basketball", defaultTeamSize: 5 });
    const [viewer, ideal, closer, blocked, noLocation, otherSport, blockedByViewer] = await Promise.all(
      ["viewer", "ideal", "closer", "blocked", "noLocation", "otherSport", "blockedByViewer"].map(register),
    );
    const point = (longitude) => ({ type: "Point", coordinates: [longitude, 0] });
    await User.updateOne({ _id: viewer.user.id }, { $set: { location: point(0) } });
    await User.updateOne({ _id: ideal.user.id }, { $set: { location: point(0.005) } });
    await User.updateOne({ _id: closer.user.id }, { $set: { location: point(0.0005) } });
    await User.updateOne({ _id: blocked.user.id }, { $set: { location: point(0.0001) } });
    await User.updateOne({ _id: otherSport.user.id }, { $set: { location: point(0.0002) } });

    const availableNY = { day: 1, from: "09:00", to: "10:00" };
    const availableIndia = { day: 1, from: "18:30", to: "19:30" };
    await PlayerSport.create([
      { user: viewer.user.id, sport: sport.id, skillLevel: "Intermediate", availability: [availableNY], timeZone: "America/New_York" },
      { user: ideal.user.id, sport: sport.id, skillLevel: "Intermediate", availability: [availableIndia], timeZone: "Asia/Kolkata" },
      { user: closer.user.id, sport: sport.id, skillLevel: "Advanced", availability: [], timeZone: "UTC" },
      { user: blocked.user.id, sport: sport.id, skillLevel: "Intermediate", availability: [availableIndia], timeZone: "Asia/Kolkata" },
      { user: noLocation.user.id, sport: sport.id, skillLevel: "Beginner", availability: [], timeZone: "UTC" },
      { user: otherSport.user.id, sport: basketball.id, skillLevel: "Intermediate", availability: [availableIndia], timeZone: "Asia/Kolkata" },
      { user: blockedByViewer.user.id, sport: sport.id, skillLevel: "Intermediate", availability: [availableIndia], timeZone: "Asia/Kolkata" },
    ]);
    await Block.create([
      { owner: blocked.user.id, target: viewer.user.id },
      { owner: viewer.user.id, target: blockedByViewer.user.id },
    ]);

    const results = await call("get", "/discovery/players?sort=recommended&page=1&limit=20", viewer.accessToken);
    assert.equal(results.status, 200, JSON.stringify(results.body));
    assert.deepEqual(results.body.data.items.map((row) => row._id), [ideal.user.id, closer.user.id, noLocation.user.id]);
    assert.ok(results.body.data.items[0].recommendationReasons.includes("Available at the same time"));
    assert.equal(results.body.data.items[0].distanceApproximate, true);
    assert.equal(results.body.data.items.find((row) => row._id === noLocation.user.id).distanceKm, null);
    assert.equal(JSON.stringify(results.body).includes("coordinates"), false);

    const filtered = await call("get", "/discovery/players?sort=recommended&q=closer&skillLevel=Advanced&page=1&limit=20", viewer.accessToken);
    assert.deepEqual(filtered.body.data.items.map((row) => row._id), [closer.user.id]);
    const radiusLimited = await call("get", "/discovery/players?sort=recommended&radiusKm=1&page=1&limit=20", viewer.accessToken);
    assert.equal(radiusLimited.body.data.items.some((row) => row._id === noLocation.user.id), false);

    const pageOne = await call("get", "/discovery/players?sort=recommended&page=1&limit=1", viewer.accessToken);
    const pageTwo = await call("get", "/discovery/players?sort=recommended&page=2&limit=1", viewer.accessToken);
    assert.equal(pageOne.body.data.total, 3);
    assert.equal((await call("get", "/discovery/players?sort=recommended&page=1&limit=1", viewer.accessToken)).body.data.items[0]._id, pageOne.body.data.items[0]._id);
    assert.notEqual(pageOne.body.data.items[0]._id, pageTwo.body.data.items[0]._id);

    await User.updateOne({ _id: viewer.user.id }, { $unset: { location: 1 } });
    const withoutViewerLocation = await call("get", "/discovery/players?sort=recommended&page=1&limit=20", viewer.accessToken);
    assert.equal(withoutViewerLocation.status, 200);
    assert.ok(withoutViewerLocation.body.data.items.every((row) => row.distanceKm === null));
    assert.equal((await call("get", "/discovery/players?sort=recommended&radiusKm=1", viewer.accessToken)).body.data.items.length, 0);

    const firstTeam = await Team.create({ name: "Shared hours", sport: sport.id, leader: ideal.user.id, city: "City", location: point(0.005), skillLevel: "Intermediate" });
    const blockedTeam = await Team.create({ name: "Blocked leader", sport: sport.id, leader: blocked.user.id, city: "City", location: point(0.0001), skillLevel: "Intermediate" });
    const joinedTeam = await Team.create({ name: "Already joined", sport: sport.id, leader: ideal.user.id, city: "City", location: point(0.0004), skillLevel: "Intermediate" });
    await Membership.create([
      { team: firstTeam.id, user: ideal.user.id },
      { team: blockedTeam.id, user: blocked.user.id },
      { team: joinedTeam.id, user: ideal.user.id },
      { team: joinedTeam.id, user: viewer.user.id },
    ]);
    const teamResults = await call("get", "/discovery/teams?sort=recommended&page=1&limit=20", viewer.accessToken);
    assert.equal(teamResults.status, 200, JSON.stringify(teamResults.body));
    assert.deepEqual(teamResults.body.data.items.map((row) => row._id), [firstTeam.id]);
    assert.equal(JSON.stringify(teamResults.body).includes("coordinates"), false);
    assert.ok(teamResults.body.data.items[0].recommendationReasons.includes("Available at the same time"));
  } finally {
    await close();
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("urgent recruitment permissions, duplicate applications, atomic capacity and expiry", async () => {
  const { app, close } = await startTestApp();
  try {
    const { default: Sport } = await import("../../src/modules/sports/sport.model.js");
    const { RecruitmentRequest, RecruitmentApplication } = await import("../../src/modules/open-games/recruitment.model.js");
    const sport = await Sport.create({ name: "Football", slug: "football", defaultTeamSize: 11 });
    const call = (method, path, account, body) => {
      let action = request(app)[method](`/api/v1${path}`);
      if (account) action = action.set("Authorization", `Bearer ${account.accessToken}`);
      return body ? action.send(body) : action;
    };
    async function register(name) {
      const response = await call("post", "/auth/register", null, { name, email: `${name}@example.com`, password: "a-strong-password-123" });
      assert.equal(response.status, 201);
      return response.body.data;
    }
    const organizer = await register("organizer");
    const playerA = await register("playera");
    const playerB = await register("playerb");
    const outsider = await register("outsider");
    const create = await call("post", "/open-games/urgent", organizer, {
      sport: sport.id, startsAt: new Date(Date.now() + 2 * 3600000).toISOString(), skillPreference: "Any", slots: 1,
      venue: { name: "Ground", address: "Town", location: { type: "Point", coordinates: [76.7, 30.7] } },
    });
    assert.equal(create.status, 201, JSON.stringify(create.body));
    const id = create.body.data._id;
    assert.equal((await call("post", `/open-games/urgent/${id}/close`, outsider)).status, 403);
    const one = await call("post", `/open-games/urgent/${id}/apply`, playerA);
    assert.equal(one.status, 201);
    assert.equal((await call("post", `/open-games/urgent/${id}/apply`, playerA)).status, 409);
    const two = await call("post", `/open-games/urgent/${id}/apply`, playerB);
    assert.equal(two.status, 201);
    assert.equal((await call("get", `/open-games/urgent/${id}/applications`, outsider)).status, 403);
    const firstDecision = call("patch", `/open-games/urgent/applications/${one.body.data._id}`, organizer, { decision: "accepted" });
    const secondDecision = call("patch", `/open-games/urgent/applications/${two.body.data._id}`, organizer, { decision: "accepted" });
    const outcomes = await Promise.all([firstDecision, secondDecision]);
    assert.deepEqual(outcomes.map((item) => item.status).sort(), [200, 409]);
    assert.equal((await RecruitmentRequest.findById(id)).confirmedPlayers.length, 1);
    assert.equal((await call("post", `/open-games/urgent/${id}/close`, organizer)).status, 200);
    const cancelRequest = await call("post", "/open-games/urgent", organizer, {
      sport: sport.id, startsAt: new Date(Date.now() + 3600000).toISOString(), skillPreference: "Beginner", slots: 2,
      venue: { name: "Ground", address: "Town", location: { type: "Point", coordinates: [76.7, 30.7] } },
    });
    const cancelId = cancelRequest.body.data._id;
    const pending = await call("post", `/open-games/urgent/${cancelId}/apply`, playerA);
    assert.equal((await call("post", `/open-games/urgent/applications/${pending.body.data._id}/cancel`, playerA)).status, 200);
    const expiring = await call("post", "/open-games/urgent", organizer, {
      sport: sport.id, startsAt: new Date(Date.now() + 3600000).toISOString(), skillPreference: "Any", slots: 1,
      venue: { name: "Ground", address: "Town", location: { type: "Point", coordinates: [76.7, 30.7] } },
    });
    await RecruitmentRequest.updateOne({ _id: expiring.body.data._id }, { $set: { startsAt: new Date(Date.now() - 1000) } });
    await call("get", "/open-games/urgent?page=1&limit=20&timeZone=Asia%2FKolkata", playerB);
    assert.equal((await RecruitmentRequest.findById(expiring.body.data._id)).status, "expired");
    assert.equal(await RecruitmentApplication.countDocuments({ request: pending.body.data.request }), 1);
  } finally {
    await close();
  }
});

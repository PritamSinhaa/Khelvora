import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("availability polls enforce membership and lifecycle; reminders persist, reschedule and deduplicate", async () => {
  const { app, close } = await startTestApp();
  try {
    const { default: Sport } = await import("../../src/modules/sports/sport.model.js");
    const { default: Match } = await import("../../src/modules/matches/match.model.js");
    const { default: MatchReminder } = await import("../../src/modules/matches/matchReminder.model.js");
    const { default: Notification } = await import("../../src/modules/notifications/notification.model.js");
    const { deliverDueReminders } = await import("../../src/modules/matches/reminder.service.js");
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
    const homeLeader = await register("homeleader");
    const awayLeader = await register("awayleader");
    const outsider = await register("outsider");
    const homeResponse = await call("post", "/teams", homeLeader, { name: "Home", sport: sport.id, city: "Town", location: { type: "Point", coordinates: [76.7, 30.7] }, skillLevel: "Intermediate", maxMembers: 4 });
    const awayResponse = await call("post", "/teams", awayLeader, { name: "Away", sport: sport.id, city: "Town", location: { type: "Point", coordinates: [76.8, 30.8] }, skillLevel: "Intermediate", maxMembers: 4 });
    const location = { type: "Point", coordinates: [76.7, 30.7] };
    const dateInOffset = (date) => `${new Date(+date + 330 * 60000).toISOString().slice(0, 19)}+05:30`;
    const start = new Date(Date.now() + 3 * 86400000);
    const end = new Date(+start + 3600000);
    const challenge = await call("post", "/challenges", homeLeader, { fromTeam: homeResponse.body.data._id, toTeam: awayResponse.body.data._id, schedule: { startsAt: dateInOffset(start), endsAt: dateInOffset(end), venue: { name: "Ground", address: "Town", location } } });
    assert.equal(challenge.status, 201, JSON.stringify(challenge.body));
    const accepted = await call("patch", `/challenges/${challenge.body.data._id}`, awayLeader, { decision: "accepted" });
    assert.equal(accepted.status, 200, JSON.stringify(accepted.body));
    const matchId = String((await Match.findOne())._id);
    assert.deepEqual((await MatchReminder.find({ match: matchId }).distinct("offsetMinutes")).sort((a, b) => b - a), [1440, 60]);

    const optionA = new Date(Date.now() + 4 * 86400000);
    const optionB = new Date(Date.now() + 5 * 86400000);
    const closesAt = new Date(Date.now() + 2 * 86400000);
    const pollBody = { matchId, closesAt: dateInOffset(closesAt), options: [optionA, optionB].map((date) => ({ startsAt: dateInOffset(date), endsAt: dateInOffset(new Date(+date + 3600000)) })) };
    assert.equal((await call("post", "/availability-polls", outsider, pollBody)).status, 403);
    const created = await call("post", "/availability-polls", homeLeader, pollBody);
    assert.equal(created.status, 201, JSON.stringify(created.body));
    const pollId = created.body.data._id;
    assert.equal((await call("put", `/availability-polls/${pollId}/votes`, outsider, { option: 0, response: "available" })).status, 403);
    assert.equal((await call("put", `/availability-polls/${pollId}/votes`, awayLeader, { option: 0, response: "maybe" })).status, 200);
    assert.equal((await call("put", `/availability-polls/${pollId}/votes`, awayLeader, { option: 0, response: "available" })).status, 200);
    assert.equal((await call("post", `/availability-polls/${pollId}/close`, outsider, { selectedOption: 1 })).status, 403);
    const listed = await call("get", `/matches/${matchId}/availability-polls`, awayLeader);
    assert.equal(listed.body.data[0].options[0].totals.available, 1);
    assert.equal(listed.body.data[0].options[0].myResponse, "available");

    const before = await MatchReminder.find({ match: matchId, reminderRevision: 0 });
    assert.ok(before.length >= 4);
    const closed = await call("post", `/availability-polls/${pollId}/close`, homeLeader, { selectedOption: 1 });
    assert.equal(closed.status, 200, JSON.stringify(closed.body));
    assert.equal((await Match.findById(matchId)).startsAt.toISOString(), new Date(pollBody.options[1].startsAt).toISOString());
    assert.ok((await MatchReminder.countDocuments({ match: matchId, reminderRevision: 0, status: "cancelled" })) >= 4);
    assert.equal((await call("put", `/availability-polls/${pollId}/votes`, awayLeader, { option: 0, response: "unavailable" })).status, 409);
    assert.ok(await Notification.countDocuments({ type: "availability-poll", entityId: pollId }));

    const changed = await call("put", `/matches/${matchId}/reminders`, homeLeader, { offsetsMinutes: [120, 30] });
    assert.equal(changed.status, 200, JSON.stringify(changed.body));
    assert.deepEqual((await MatchReminder.find({ match: matchId, status: "pending" }).distinct("offsetMinutes")).sort((a, b) => b - a), [120, 30]);
    const due = await MatchReminder.findOne({ match: matchId, status: "pending" });
    await MatchReminder.updateOne({ _id: due._id }, { $set: { scheduledFor: new Date(Date.now() - 1000) } });
    await deliverDueReminders();
    await deliverDueReminders();
    assert.equal(await Notification.countDocuments({ type: "match-reminder", deduplicationKey: { $regex: `:${due.offsetMinutes}:${due.reminderRevision}$` } }), 1);
    assert.equal((await MatchReminder.findById(due._id)).status, "sent");

    const cancelled = await call("post", `/matches/${matchId}/cancel`, homeLeader);
    assert.equal(cancelled.status, 200);
    assert.equal(await MatchReminder.countDocuments({ match: matchId, status: "pending" }), 0);
  } finally {
    await close();
  }
});

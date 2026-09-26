import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("confirmed results drive statistics, corrections, history and sport leaderboard ordering", async () => {
  const { app, close } = await startTestApp();
  try {
    const { default: Sport } = await import("../../src/modules/sports/sport.model.js");
    const { default: Team } = await import("../../src/modules/teams/team.model.js");
    const { default: Challenge } = await import("../../src/modules/challenges/challenge.model.js");
    const { default: Match } = await import("../../src/modules/matches/match.model.js");
    const { default: Result } = await import("../../src/modules/results/result.model.js");

    const call = (method, path, token, body) => {
      let action = request(app)[method](`/api/v1${path}`).set("Authorization", `Bearer ${token}`);
      return body ? action.send(body) : action;
    };
    async function register(name) {
      const res = await request(app).post("/api/v1/auth/register").send({ name, email: `${name}@example.com`, password: "a-strong-password-123" });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      return res.body.data;
    }

    const sport = await Sport.create({ name: "Statistics Football", slug: "statistics-football", defaultTeamSize: 11 });
    const accounts = await Promise.all([register("stat-alpha"), register("stat-bravo"), register("stat-charlie"), register("stat-delta")]);
    const location = { type: "Point", coordinates: [76.7, 30.7] };
    async function makeTeam(account, name, city = "Stat City") {
      const res = await call("post", "/teams", account.accessToken, { name, sport: sport.id, city, location, skillLevel: "Intermediate", maxMembers: 30 });
      assert.equal(res.status, 201, JSON.stringify(res.body));
      return res.body.data;
    }
    const alpha = await makeTeam(accounts[0], "Alpha Statistics");
    const bravo = await makeTeam(accounts[1], "Bravo Statistics");
    const short = await makeTeam(accounts[2], "Short Season");
    const opponent = await makeTeam(accounts[3], "Outside City", "Other City");

    const startsBase = Date.now() - 12 * 86400000;
    async function fixture(home, away, index, homeScore, awayScore) {
      const startsAt = new Date(startsBase + index * 86400000);
      const endsAt = new Date(startsAt.getTime() + 2 * 3600000);
      const venue = { name: "Ground", address: "Stat City", location };
      const challenge = await Challenge.create({ fromTeam: home._id, toTeam: away._id, createdBy: home.leader, startsAt, endsAt, venue, status: "accepted" });
      const match = await Match.create({ challenge: challenge._id, homeTeam: home._id, awayTeam: away._id, sport: sport._id, startsAt, endsAt, venue, status: "completed", homeRosterUserIds: [home.leader] });
      const result = await Result.create({ match: match._id, submittedByTeam: home._id, homeScore, awayScore, status: "confirmed", confirmedAt: new Date() });
      return { match, result };
    }
    const outcomes = [[2, 0], [1, 0], [3, 0], [1, 1], [0, 1]];
    const fixtures = [];
    for (let i = 0; i < outcomes.length; i += 1) fixtures.push(await fixture(alpha, bravo, i, ...outcomes[i]));
    await fixture(short, opponent, 8, 2, 0);
    await fixture(short, opponent, 9, 0, 1);
    const cancelled = await fixture(alpha, bravo, 10, 9, 0);
    await Match.updateOne({ _id: cancelled.match._id }, { $set: { status: "cancelled" } });

    let stats = await call("get", `/teams/${alpha._id}/stats`, accounts[0].accessToken);
    assert.equal(stats.status, 200, JSON.stringify(stats.body));
    assert.deepEqual([stats.body.data.completedMatches, stats.body.data.wins, stats.body.data.draws, stats.body.data.losses], [5, 3, 1, 1]);
    assert.equal(stats.body.data.winPercentage, 60);
    assert.deepEqual(stats.body.data.recentForm.map((item) => item.outcome), ["L", "D", "W", "W", "W"]);

    const history = await call("get", `/teams/${alpha._id}/history?page=1&limit=2&sport=${sport.id}`, accounts[0].accessToken);
    assert.equal(history.status, 200, JSON.stringify(history.body));
    assert.equal(history.body.data.total, 5);
    assert.equal(history.body.data.items.length, 2);
    assert.equal(history.body.data.items[0].matchId, fixtures[4].match.id);

    const playerHistory = await call("get", "/users/me/match-history?page=1&limit=10", accounts[0].accessToken);
    assert.equal(playerHistory.status, 200, JSON.stringify(playerHistory.body));
    assert.equal(playerHistory.body.data.total, 5);
    assert.ok(playerHistory.body.data.items.every((item) => item.participationSource === "Roster when the match was scheduled"));
    assert.equal("goals" in playerHistory.body.data.items[0], false);

    const board = await call("get", `/statistics/leaderboards/teams?sport=${sport.id}&season=${new Date(startsBase).getUTCFullYear()}&city=Stat%20City`, accounts[0].accessToken);
    assert.equal(board.status, 200, JSON.stringify(board.body));
    assert.equal(board.body.data.items.length, 2, "teams with fewer than five results are excluded");
    assert.equal(board.body.data.items[0].teamId, alpha._id);
    assert.equal(board.body.data.items[1].teamId, bravo._id);

    const correction = await call("post", "/results", accounts[0].accessToken, { matchId: fixtures[0].match.id, homeScore: 0, awayScore: 2, notes: "Corrected score" });
    assert.equal(correction.status, 201, JSON.stringify(correction.body));
    assert.equal(correction.body.data.homeScore, 2, "confirmed score remains canonical while correction is pending");
    assert.equal(correction.body.data.correctionProposal.homeScore, 0);
    stats = await call("get", `/teams/${alpha._id}/stats`, accounts[0].accessToken);
    assert.equal(stats.body.data.wins, 3);

    const confirmed = await call("patch", `/results/${correction.body.data._id}`, accounts[1].accessToken, { decision: "confirmed" });
    assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
    assert.equal(confirmed.body.data.homeScore, 0);
    assert.equal(confirmed.body.data.correctionCount, 1);
    const repeated = await call("patch", `/results/${correction.body.data._id}`, accounts[1].accessToken, { decision: "confirmed" });
    assert.equal(repeated.status, 409);
    stats = await call("get", `/teams/${alpha._id}/stats`, accounts[0].accessToken);
    assert.deepEqual([stats.body.data.completedMatches, stats.body.data.wins, stats.body.data.draws, stats.body.data.losses], [5, 2, 1, 2]);
    assert.equal(await Result.countDocuments({ match: fixtures[0].match._id }), 1);
  } finally {
    await close();
  }
});

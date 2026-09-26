import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("dashboard endpoints select the next authorized match and isolate action and unread data", async () => {
  const { app, close } = await startTestApp();
  try {
    const [{ default: Sport }, { default: Challenge }, { default: Match }, { default: Invitation }, { default: JoinRequest }, { default: Conversation }, { default: Message }, { default: Notification }, { default: OpenGame }, { default: User }] = await Promise.all([
      import("../../src/modules/sports/sport.model.js"),
      import("../../src/modules/challenges/challenge.model.js"),
      import("../../src/modules/matches/match.model.js"),
      import("../../src/modules/invitations/invitation.model.js"),
      import("../../src/modules/join-requests/joinRequest.model.js"),
      import("../../src/modules/conversations/conversation.model.js"),
      import("../../src/modules/messages/message.model.js"),
      import("../../src/modules/notifications/notification.model.js"),
      import("../../src/modules/open-games/openGame.model.js"),
      import("../../src/modules/users/user.model.js"),
    ]);
    const call = (method, path, token, body) => {
      let action = request(app)[method](`/api/v1${path}`).set("Authorization", `Bearer ${token}`);
      return body ? action.send(body) : action;
    };
    async function register(name) {
      const response = await request(app).post("/api/v1/auth/register").send({ name, email: `${name}@example.com`, password: "a-strong-password-123" });
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return response.body.data;
    }

    const [alpha, bravo, outsider] = await Promise.all([register("dashboard-alpha"), register("dashboard-bravo"), register("dashboard-outsider")]);
    const sport = await Sport.create({ name: "Dashboard Football", slug: "dashboard-football", defaultTeamSize: 11 });
    const location = { type: "Point", coordinates: [76.7, 30.7] };
    async function createTeam(account, name) {
      const response = await call("post", "/teams", account.accessToken, { name, sport: sport.id, city: "Mohali", location, skillLevel: "Intermediate", maxMembers: 20 });
      assert.equal(response.status, 201, JSON.stringify(response.body));
      return response.body.data;
    }
    const home = await createTeam(alpha, "Dashboard Home");
    const away = await createTeam(bravo, "Dashboard Away");
    const now = Date.now();
    const venue = { name: "Local Ground", address: "Mohali", location };
    async function scheduledMatch(startsAt) {
      const endsAt = new Date(startsAt.getTime() + 2 * 3600000);
      const challenge = await Challenge.create({ fromTeam: home._id, toTeam: away._id, createdBy: alpha.user.id, startsAt, endsAt, venue, status: "accepted" });
      return Match.create({ challenge: challenge._id, homeTeam: home._id, awayTeam: away._id, sport: sport._id, startsAt, endsAt, venue, status: "scheduled" });
    }
    const next = await scheduledMatch(new Date(now + 86400000));
    await scheduledMatch(new Date(now + 3 * 86400000));

    const upcoming = await call("get", "/matches/upcoming", alpha.accessToken);
    assert.equal(upcoming.status, 200, JSON.stringify(upcoming.body));
    assert.equal(upcoming.headers["cache-control"], "no-store");
    assert.equal(upcoming.body.data._id, next.id);
    assert.equal(upcoming.body.data.attendanceStatus, null);
    assert.equal((await call("get", "/matches/upcoming", outsider.accessToken)).body.data, null);

    const invitation = await Invitation.create({ team: home._id, user: bravo.user.id, invitedBy: alpha.user.id, expiresAt: new Date(now + 86400000) });
    const joinRequest = await JoinRequest.create({ team: home._id, user: bravo.user.id, message: "Please add me" });
    const inbound = await Challenge.create({ fromTeam: away._id, toTeam: home._id, createdBy: bravo.user.id, startsAt: new Date(now + 5 * 86400000), endsAt: new Date(now + 5 * 86400000 + 7200000), venue, status: "pending" });
    assert.ok(invitation && joinRequest && inbound);
    const [alphaActions, bravoActions, outsiderActions] = await Promise.all([
      call("get", "/dashboard/actions", alpha.accessToken),
      call("get", "/dashboard/actions", bravo.accessToken),
      call("get", "/dashboard/actions", outsider.accessToken),
    ]);
    assert.equal(alphaActions.body.data.joinRequests[0]._id, joinRequest.id);
    assert.equal(alphaActions.body.data.challenges[0]._id, inbound.id);
    assert.equal(alphaActions.body.data.invitations.length, 0);
    assert.equal(bravoActions.body.data.invitations[0]._id, invitation.id);
    assert.equal(bravoActions.body.data.joinRequests.length, 0);
    assert.deepEqual(outsiderActions.body.data, { invitations: [], joinRequests: [], challenges: [] });

    await User.updateOne({ _id: alpha.user.id }, { $set: { location } });
    const gameStart = new Date(now + 2 * 86400000);
    const gameFields = { host: alpha.user.id, sport: sport._id, startsAt: gameStart, endsAt: new Date(gameStart.getTime() + 7200000), capacity: 4, venue: { ...venue, name: "Nearby Court" } };
    await OpenGame.create({ ...gameFields, title: "Open nearby", players: [alpha.user.id] });
    await OpenGame.create({ ...gameFields, title: "Already full", capacity: 2, players: [alpha.user.id, bravo.user.id] });
    await OpenGame.create({ ...gameFields, title: "Too far away", venue: { ...venue, location: { type: "Point", coordinates: [77.4, 30.7] } } });
    const nearbyGames = await call("get", "/open-games/nearby", alpha.accessToken);
    assert.equal(nearbyGames.status, 200, JSON.stringify(nearbyGames.body));
    assert.equal(nearbyGames.body.data.items.length, 1);
    assert.equal(nearbyGames.body.data.items[0].title, "Open nearby");
    assert.equal(nearbyGames.body.data.items[0].remainingPlaces, 3);

    const privateConversation = await Conversation.create({ kind: "direct", key: `direct:${alpha.user.id}:${bravo.user.id}`, participants: [alpha.user.id, bravo.user.id] });
    const unrelatedConversation = await Conversation.create({ kind: "direct", key: `direct:${alpha.user.id}:${outsider.user.id}`, participants: [alpha.user.id, outsider.user.id] });
    const conversationForOthers = await Conversation.create({ kind: "direct", key: `direct:${bravo.user.id}:${outsider.user.id}`, participants: [bravo.user.id, outsider.user.id] });
    await Message.create({ conversation: privateConversation._id, sender: alpha.user.id, text: "Kickoff is at seven", clientId: "dashboard-message-1" });
    await Message.create({ conversation: unrelatedConversation._id, sender: alpha.user.id, text: "Private conversation", clientId: "dashboard-message-2" });
    await Message.create({ conversation: conversationForOthers._id, sender: bravo.user.id, text: "Only for other participants", clientId: "dashboard-message-3" });
    await Notification.create({ user: bravo.user.id, type: "message", text: "You have a new message.", entityId: String(privateConversation._id), targetType: "conversation", deduplicationKey: "dashboard-unread-bravo" });
    await Notification.create({ user: outsider.user.id, type: "message", text: "You have a new message.", entityId: String(unrelatedConversation._id), targetType: "conversation", deduplicationKey: "dashboard-unread-outsider" });
    await Notification.create({ user: alpha.user.id, type: "message", text: "You have a new message.", entityId: String(conversationForOthers._id), targetType: "conversation", deduplicationKey: "dashboard-unread-private" });
    const [bravoUnread, alphaUnread] = await Promise.all([
      call("get", "/dashboard/unread-conversations", bravo.accessToken),
      call("get", "/dashboard/unread-conversations", alpha.accessToken),
    ]);
    assert.equal(bravoUnread.body.data.length, 1);
    assert.equal(bravoUnread.body.data[0].preview, "Kickoff is at seven");
    assert.equal(alphaUnread.body.data.length, 0);
  } finally {
    await close();
  }
});

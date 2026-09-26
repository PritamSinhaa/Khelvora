import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { startTestApp } from "../helpers/database.js";

test("membership, leader permissions, chat and match creation", async () => {
  const { app, close } = await startTestApp();

  try {
    const { default: Sport } =
      await import("../../src/modules/sports/sport.model.js");

    const { default: Conversation } =
      await import("../../src/modules/conversations/conversation.model.js");

    const { default: Match } =
      await import("../../src/modules/matches/match.model.js");
    const { default: Notification } =
      await import("../../src/modules/notifications/notification.model.js");

    const sport = await Sport.create({
      name: "Football",
      slug: "football",
      defaultTeamSize: 11,
    });

    function call(method, path, token, body) {
      let action = request(app)[method](`/api/v1${path}`);

      if (token) {
        action = action.set("Authorization", `Bearer ${token}`);
      }

      return body ? action.send(body) : action;
    }

    async function register(name) {
      const response = await call("post", "/auth/register", null, {
        name,
        email: `${name}@example.com`,
        password: "a-strong-password-123",
      });

      assert.equal(response.status, 201, JSON.stringify(response.body));

      assert.equal(response.body.data.user.passwordHash, undefined);

      return response.body.data;
    }

    const alpha = await register("alpha");
    const bravo = await register("bravo");
    const member = await register("charlie");
    const outsider = await register("delta");

    const location = {
      type: "Point",
      coordinates: [76.7, 30.7],
    };

    async function createTeam(account, name) {
      const response = await call("post", "/teams", account.accessToken, {
        name,
        sport: sport.id,
        city: "Mohali",
        location,
        skillLevel: "Intermediate",
        maxMembers: 2,
      });

      assert.equal(response.status, 201, JSON.stringify(response.body));

      return response.body.data;
    }

    const home = await createTeam(alpha, "United");
    const away = await createTeam(bravo, "City");

    const join = await call("post", "/join-requests", member.accessToken, {
      teamId: home._id,
    });

    assert.equal(join.status, 201);
    assert.equal(await Notification.countDocuments({ user: alpha.user.id, type: "join-request" }), 1);

    const joinPath = `/join-requests/${join.body.data._id}`;

    assert.equal(
      (
        await call("patch", joinPath, outsider.accessToken, {
          decision: "accepted",
        })
      ).status,
      403,
    );

    assert.equal(
      (
        await call("patch", joinPath, alpha.accessToken, {
          decision: "accepted",
        })
      ).status,
      200,
    );

    assert.equal(
      (
        await call("patch", joinPath, alpha.accessToken, {
          decision: "accepted",
        })
      ).status,
      409,
    );
    assert.equal(await Notification.countDocuments({ user: member.user.id, type: "join-request" }), 1);

    const conversation = await Conversation.findOne({
      team: home._id,
      kind: "team",
    });

    const messageData = {
      conversationId: conversation.id,
      text: "Practice today?",
      clientId: crypto.randomUUID(),
    };

    const firstMessage = await call(
      "post",
      "/messages",
      member.accessToken,
      messageData,
    );

    assert.equal(firstMessage.status, 201);

    const repeatedMessage = await call(
      "post",
      "/messages",
      member.accessToken,
      messageData,
    );

    assert.equal(repeatedMessage.body.data._id, firstMessage.body.data._id);
    assert.equal(await Notification.countDocuments({ user: alpha.user.id, type: "message" }), 1);

    assert.equal(
      (
        await call(
          "get",
          `/messages?conversationId=${conversation.id}`,
          outsider.accessToken,
        )
      ).status,
      403,
    );

    const schedule = {
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 90000000).toISOString(),

      venue: {
        name: "Sports Ground",
        address: "Mohali",
        location,
      },
    };

    const challengeData = {
      fromTeam: home._id,
      toTeam: away._id,
      schedule,
    };

    assert.equal(
      (await call("post", "/challenges", member.accessToken, challengeData))
        .status,
      403,
    );

    const challenge = await call(
      "post",
      "/challenges",
      alpha.accessToken,
      challengeData,
    );

    assert.equal(challenge.status, 201);
    assert.equal(await Notification.countDocuments({ user: bravo.user.id, type: "challenge" }), 1);

    const challengePath = `/challenges/${challenge.body.data._id}`;

    assert.equal(
      (
        await call("patch", challengePath, alpha.accessToken, {
          decision: "accepted",
        })
      ).status,
      403,
    );

    assert.equal(
      (
        await call("patch", challengePath, bravo.accessToken, {
          decision: "accepted",
        })
      ).status,
      200,
    );

    assert.equal(
      (
        await call("patch", challengePath, bravo.accessToken, {
          decision: "accepted",
        })
      ).status,
      409,
    );

    assert.equal(await Match.countDocuments(), 1);
    assert.equal(await Notification.countDocuments({ user: alpha.user.id, type: "match" }), 1);
    assert.equal(await Notification.countDocuments({ user: bravo.user.id, type: "match" }), 1);

    await call(
      "delete",
      `/memberships/teams/${home._id}/me`,
      member.accessToken,
    );

    assert.equal(
      (
        await call(
          "get",
          `/messages?conversationId=${conversation.id}`,
          member.accessToken,
        )
      ).status,
      403,
    );

    assert.equal(
      (await call("post", "/auth/logout", alpha.accessToken)).status,
      200,
    );

    assert.equal(
      (await call("get", "/users/me", alpha.accessToken)).status,
      401,
    );
  } finally {
    await close();
  }
});

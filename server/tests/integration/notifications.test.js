import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { startTestApp } from "../helpers/database.js";

test("notifications are private, counted, deduplicated and recoverable on refetch", async () => {
  const { app, close } = await startTestApp();
  try {
    const { notify } = await import("../../src/modules/notifications/notification.service.js");
    const Notification = (await import("../../src/modules/notifications/notification.model.js")).default;
    const call = (method, path, token) => request(app)[method](`/api/v1${path}`).set("Authorization", `Bearer ${token}`);

    async function register(name) {
      const result = await request(app).post("/api/v1/auth/register").send({
        name,
        email: `${name}@example.com`,
        password: "a-strong-password-123",
      });
      assert.equal(result.status, 201, JSON.stringify(result.body));
      return result.body.data;
    }

    const alice = await register("alice");
    const bob = await register("bob");
    const key = "challenge:abc123:created";
    const first = await notify(alice.user.id, "challenge", "A team challenged you.", "abc123", "challenge", key, "/challenges");
    const retry = await notify(alice.user.id, "challenge", "A team challenged you.", "abc123", "challenge", key, "/challenges");
    assert.equal(String(first._id), String(retry._id));
    await notify(bob.user.id, "message", "You have a new message.", "conversation123", "conversation", "message:message123:bob", "/messages/conversation123");

    const aliceCount = await call("get", "/notifications/unread-count", alice.accessToken);
    assert.equal(aliceCount.status, 200);
    assert.equal(aliceCount.body.data, 1);

    const all = await call("get", "/notifications?page=1&limit=20", alice.accessToken);
    assert.equal(all.body.data.total, 1);
    assert.equal(all.body.data.items[0].link, "/challenges");

    const recovered = await call("get", "/notifications?page=1&limit=20&unread=true", alice.accessToken);
    assert.equal(recovered.body.data.items.length, 1, "persisted unread records can be fetched again after reconnect");
    assert.equal((await call("get", "/notifications?page=1&limit=20&unread=true", bob.accessToken)).body.data.items.length, 1);

    const notificationId = all.body.data.items[0]._id;
    assert.equal((await call("patch", `/notifications/${notificationId}/read`, bob.accessToken)).status, 404);
    assert.equal((await call("get", "/notifications/unread-count", alice.accessToken)).body.data, 1);
    assert.equal((await call("patch", `/notifications/${notificationId}/read`, alice.accessToken)).status, 200);
    assert.equal((await call("get", "/notifications/unread-count", alice.accessToken)).body.data, 0);

    await notify(alice.user.id, "message", "Another new message.", "conversation123", "conversation", "message:message124:alice", "/messages/conversation123");
    assert.equal((await call("patch", "/notifications/read-all", alice.accessToken)).status, 200);
    assert.equal((await call("get", "/notifications/unread-count", alice.accessToken)).body.data, 0);
    assert.equal(await Notification.countDocuments({ user: alice.user.id }), 2);
    assert.equal((await call("get", "/notifications/unread-count", "")).status, 401);
  } finally {
    await close();
  }
});

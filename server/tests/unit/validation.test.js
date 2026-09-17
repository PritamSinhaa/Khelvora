import { test } from "node:test";
import assert from "node:assert/strict";

import { register } from "../../src/modules/auth/auth.validation.js";
import { schedule, point } from "../../src/utils/validation.js";
import { escapeRegex } from "../../src/utils/http.js";

test("registration rejects role injection and long UTF-8 passwords", () => {
  assert.equal(
    register.safeParse({
      name: "Player",
      email: "player@example.com",
      password: "long-password-123",
      role: "admin",
    }).success,
    false,
  );

  assert.equal(
    register.safeParse({
      name: "Player",
      email: "player@example.com",
      password: "😀".repeat(19),
    }).success,
    false,
  );
});

test("invalid coordinates and inverted schedules are rejected", () => {
  assert.equal(
    point.safeParse({
      type: "Point",
      coordinates: [181, 30],
    }).success,
    false,
  );

  assert.equal(
    schedule.safeParse({
      startsAt: "2030-01-02T10:00:00Z",
      endsAt: "2030-01-02T09:00:00Z",

      venue: {
        name: "Court",
        address: "Mohali",
        location: {
          type: "Point",
          coordinates: [76, 30],
        },
      },
    }).success,
    false,
  );
});

test("team search treats regex characters literally", () => {
  const value = "a.*[x](+)?$^|\\";

  assert.equal(
    new RegExp(escapeRegex(value)).test(value),
    true,
  );

  assert.equal(
    new RegExp(escapeRegex(".*")).test("anything"),
    false,
  );
});
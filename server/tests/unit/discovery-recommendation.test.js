import { test } from "node:test";
import assert from "node:assert/strict";
import { availabilityOverlaps } from "../../src/modules/discovery/availability.js";
import {
  RECOMMENDATION_WEIGHTS,
  rankCursor,
  scoreRecommendation,
} from "../../src/modules/discovery/recommendation.js";

const monday = (from, to, timeZone, skillLevel = "Intermediate") => ({
  sport: "football",
  skillLevel,
  timeZone,
  availability: [{ day: 1, from, to }],
});

test("recommendation scoring is weighted and explains each matching signal", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const viewer = monday("09:00", "10:00", "America/New_York");
  const target = monday("18:30", "19:30", "Asia/Kolkata");
  const result = scoreRecommendation({
    viewerProfiles: [viewer],
    targetProfiles: [target],
    sport: "football",
    viewerLocation: { coordinates: [0, 0] },
    targetLocation: { coordinates: [0.005, 0] },
    radiusKm: 100,
    now,
  });

  assert.equal(RECOMMENDATION_WEIGHTS.sport + RECOMMENDATION_WEIGHTS.distance + RECOMMENDATION_WEIGHTS.skill + RECOMMENDATION_WEIGHTS.availability, 100);
  assert.ok(result.score > 99 && result.score < 100);
  assert.deepEqual(result.reasons, ["Same sport", "Similar skill level", "Available at the same time", "Nearby"]);
  assert.equal(result.approximateDistanceKm, 5);
});

test("weekly availability compares local times across zones and seasonal offsets", () => {
  const newYork = monday("09:00", "10:00", "America/New_York");
  const kolkata = monday("18:30", "19:30", "Asia/Kolkata");
  assert.equal(availabilityOverlaps(newYork, kolkata, new Date("2026-06-01T00:00:00Z")), true);
  assert.equal(availabilityOverlaps(newYork, kolkata, new Date("2026-01-05T00:00:00Z")), false);
});

test("missing location, skill, and availability lower scores without breaking recommendations", () => {
  const result = scoreRecommendation({
    viewerProfiles: [{ sport: "football" }],
    targetProfiles: [{ sport: "football" }],
    sport: "football",
    viewerLocation: null,
    targetLocation: null,
  });
  assert.equal(result.score, RECOMMENDATION_WEIGHTS.sport);
  assert.deepEqual(result.reasons, ["Same sport"]);
  assert.equal(result.approximateDistanceKm, null);
});

test("ranked pages are stable and retain only the best requested window", async () => {
  const rows = [
    { _id: "c", recommendationScore: 20, _rankingDistance: 2, _rankingId: "c" },
    { _id: "a", recommendationScore: 20, _rankingDistance: 2, _rankingId: "a" },
    { _id: "e", recommendationScore: 10, _rankingDistance: 1, _rankingId: "e" },
    { _id: "b", recommendationScore: 20, _rankingDistance: 3, _rankingId: "b" },
    { _id: "d", recommendationScore: 20, _rankingDistance: 2, _rankingId: "d" },
  ];
  const result = await rankCursor((async function* () { yield* rows; })(), (row) => row, 2, 2);
  assert.equal(result.total, 5);
  assert.deepEqual(result.items.map((row) => row._id), ["d", "b"]);
});

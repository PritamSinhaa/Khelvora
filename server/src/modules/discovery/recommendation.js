import { availabilityOverlaps } from "./availability.js";

// Recommendation points: shared sport 30, distance 25, skill 20, availability 25.
export const RECOMMENDATION_WEIGHTS = Object.freeze({ sport: 30, distance: 25, skill: 20, availability: 25 });
const skillRank = new Map([["Beginner", 0], ["Intermediate", 1], ["Advanced", 2]]);

export function skillPoints(first, second) {
  if (!skillRank.has(first) || !skillRank.has(second)) return 0;
  const difference = Math.abs(skillRank.get(first) - skillRank.get(second));
  return difference === 0 ? RECOMMENDATION_WEIGHTS.skill : difference === 1 ? RECOMMENDATION_WEIGHTS.skill / 2 : 0;
}

export function distanceKm(first, second) {
  const a = first?.coordinates;
  const b = second?.coordinates;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 2 || b.length !== 2) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitude = radians(b[1] - a[1]);
  const longitude = radians(b[0] - a[0]);
  const h = Math.min(1, Math.max(0, Math.sin(latitude / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(longitude / 2) ** 2));
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bestProfileMatch(viewerProfiles, targetProfiles, targetSkill, km, radiusKm, availabilityMatch) {
  let best = { score: 0, reasons: [] };
  for (const source of viewerProfiles || []) {
    const profiles = targetProfiles === null
      ? [null]
      : (targetProfiles || []).filter((target) => String(source.sport) === String(target.sport));
    for (const target of profiles) {
      if (target && String(source.sport) !== String(target.sport)) continue;
      const sameSport = true;
      const skill = skillPoints(source.skillLevel, targetSkill || target?.skillLevel);
      const available = Boolean(target && availabilityMatch(source, target));
      const distance = km === null ? 0 : RECOMMENDATION_WEIGHTS.distance * Math.max(0, 1 - km / radiusKm);
      const score = RECOMMENDATION_WEIGHTS.sport * Number(sameSport) + distance + skill + (available ? RECOMMENDATION_WEIGHTS.availability : 0);
      const reasons = ["Same sport"];
      if (skill) reasons.push("Similar skill level");
      if (available) reasons.push("Available at the same time");
      if (km !== null && km <= radiusKm) reasons.push("Nearby");
      if (score > best.score || (score === best.score && reasons.join("|") < best.reasons.join("|"))) best = { score, reasons };
    }
  }
  return best;
}

export function scoreRecommendation({ viewerProfiles, targetProfiles, targetSkill, sport, viewerLocation, targetLocation, radiusKm = 100, now = new Date(), availabilityMatch }) {
  const km = distanceKm(viewerLocation, targetLocation);
  const compatible = (viewerProfiles || []).filter((profile) => String(profile.sport) === String(sport));
  const matcher = availabilityMatch || ((first, second) => availabilityOverlaps(first, second, now));
  const result = bestProfileMatch(compatible, targetProfiles, targetSkill, km, radiusKm, matcher);
  const approximateDistanceKm = km === null ? null : km === 0 ? 5 : Math.max(5, Math.round(km / 5) * 5);
  return { score: result.score, reasons: result.reasons, distanceKm: km, approximateDistanceKm };
}

export function compareRecommendations(first, second) {
  if (first.recommendationScore !== second.recommendationScore) return second.recommendationScore - first.recommendationScore;
  const aDistance = first._rankingDistance ?? Number.POSITIVE_INFINITY;
  const bDistance = second._rankingDistance ?? Number.POSITIVE_INFINITY;
  if (aDistance !== bDistance) return aDistance - bDistance;
  const firstId = String(first._rankingId);
  const secondId = String(second._rankingId);
  return firstId < secondId ? -1 : firstId > secondId ? 1 : 0;
}

/** Keep only page*limit best rows; never materialize the full eligible collection in app memory. */
export async function rankCursor(cursor, scoreCandidate, page, limit) {
  const retain = page * limit;
  const heap = [];
  let total = 0;
  const worse = (a, b) => compareRecommendations(a, b) > 0;
  const siftUp = (index) => {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!worse(heap[index], heap[parent])) break;
      [heap[index], heap[parent]] = [heap[parent], heap[index]];
      index = parent;
    }
  };
  const siftDown = (index) => {
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let worst = index;
      if (left < heap.length && worse(heap[left], heap[worst])) worst = left;
      if (right < heap.length && worse(heap[right], heap[worst])) worst = right;
      if (worst === index) break;
      [heap[index], heap[worst]] = [heap[worst], heap[index]];
      index = worst;
    }
  };

  for await (const row of cursor) {
    const candidate = scoreCandidate(row);
    if (!candidate) continue;
    total++;
    if (heap.length < retain) {
      heap.push(candidate);
      siftUp(heap.length - 1);
    } else if (compareRecommendations(candidate, heap[0]) < 0) {
      heap[0] = candidate;
      siftDown(0);
    }
  }
  heap.sort(compareRecommendations);
  return { items: heap.slice((page - 1) * limit, page * limit), total };
}

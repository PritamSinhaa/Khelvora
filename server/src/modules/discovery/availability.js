const weekdayIndex = new Map([
  ["Sun", 0], ["Mon", 1], ["Tue", 2], ["Wed", 3],
  ["Thu", 4], ["Fri", 5], ["Sat", 6],
]);
const formatters = new Map();

function formatter(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(timeZone, new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric", month: "2-digit", day: "2-digit",
      weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }));
  }
  return formatters.get(timeZone);
}

function zonedParts(date, timeZone) {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    weekday: weekdayIndex.get(parts.weekday), hour: Number(parts.hour), minute: Number(parts.minute),
  };
}

function localDateTimeToUtc(year, month, day, minuteOfDay, timeZone) {
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const desired = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = desired;
  for (let attempt = 0; attempt < 4; attempt++) {
    const local = zonedParts(new Date(candidate), timeZone);
    const actual = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    const adjustment = desired - actual;
    if (adjustment === 0) return new Date(candidate);
    candidate += adjustment;
  }
  const result = new Date(candidate);
  const check = zonedParts(result, timeZone);
  return check.year === year && check.month === month && check.day === day && check.hour === hour && check.minute === minute
    ? result
    : null;
}

function clockMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function slotsFor(profile, now) {
  if (!Array.isArray(profile?.availability) || !profile.availability.length) return [];
  const timeZone = profile.timeZone || "Asia/Kolkata";
  try {
    formatter(timeZone);
    const result = [];
    for (let offset = -1; offset < 15; offset++) {
      const probe = new Date(now.getTime() + offset * 86400000);
      const localDate = zonedParts(probe, timeZone);
      for (const slot of profile.availability) {
        if (!slot || slot.day !== localDate.weekday) continue;
        const start = localDateTimeToUtc(localDate.year, localDate.month, localDate.day, clockMinutes(slot.from), timeZone);
        const end = localDateTimeToUtc(localDate.year, localDate.month, localDate.day, clockMinutes(slot.to), timeZone);
        if (start && end && end > now && end > start) result.push([Math.max(start.getTime(), now.getTime()), end.getTime()]);
      }
    }
    return result.sort((first, second) => first[0] - second[0]);
  } catch {
    return [];
  }
}

/** Compare recurring local-time slots as real UTC intervals over the next two weeks. */
export function createAvailabilityMatcher(viewerProfiles = [], now = new Date()) {
  const cache = new WeakMap();
  const intervals = (profile) => {
    if (!profile || typeof profile !== "object") return [];
    if (!cache.has(profile)) cache.set(profile, slotsFor(profile, now));
    return cache.get(profile);
  };
  viewerProfiles.forEach(intervals);
  return (first, second) => {
    const a = intervals(first);
    const b = intervals(second);
    let firstIndex = 0;
    let secondIndex = 0;
    while (firstIndex < a.length && secondIndex < b.length) {
      const [aStart, aEnd] = a[firstIndex];
      const [bStart, bEnd] = b[secondIndex];
      if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) return true;
      if (aEnd <= bEnd) firstIndex++;
      else secondIndex++;
    }
    return false;
  };
}

export function availabilityOverlaps(first, second, now = new Date()) {
  return createAvailabilityMatcher([first], now)(first, second);
}

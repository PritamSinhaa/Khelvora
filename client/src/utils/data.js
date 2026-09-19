export function id(value) {
  return typeof value === "string"
    ? value
    : String(value?._id || value?.id || "");
}

export function rows(value) {
  return Array.isArray(value) ? value : value?.items || value?.data || [];
}

export const skillLevels = ["Beginner", "Intermediate", "Advanced"];

export const initials = (name = "Team") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export function dateTime(value) {
  return value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date to be confirmed";
}

export function localDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
}

export function pointFrom(values) {
  if (
    String(values.longitude ?? "").trim() === "" ||
    String(values.latitude ?? "").trim() === ""
  ) {
    throw new Error("Choose a location or enter both coordinates.");
  }

  const longitude = Number(values.longitude);
  const latitude = Number(values.latitude);

  if (
    !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
    !Number.isFinite(latitude) || Math.abs(latitude) > 90
  ) {
    throw new Error("Enter valid longitude and latitude.");
  }

  return { type: "Point", coordinates: [longitude, latitude] };
}

export function scheduleFrom(values) {
  const start = new Date(values.startsAt);
  const end = new Date(values.endsAt);

  if (
    !Number.isFinite(+start) || !Number.isFinite(+end) ||
    +start <= Date.now() || +end <= +start
  ) {
    throw new Error("Choose a future start and an end after the start.");
  }

  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    venue: {
      name: values.venueName.trim(),
      address: values.venueAddress.trim(),
      location: pointFrom(values),
    },
  };
}

export function teamView(team, sports = []) {
  const sport = typeof team.sport === "object"
    ? team.sport
    : sports.find((item) => id(item) === id(team.sport));

  return {
    ...team,
    id: id(team),
    initials: initials(team.name),
    sportLabel: sport?.name || "Team sport",
    area: team.city,
    description: team.bio,
    distanceKm: team.distanceKm ?? (
      typeof team.distanceMeters === "number"
        ? Math.round(team.distanceMeters / 100) / 10
        : null
    ),
  };
}
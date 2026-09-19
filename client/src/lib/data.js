export function id(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

export function rows(value) {
  if (Array.isArray(value)) return value;
  return Array.isArray(value?.items) ? value.items : [];
}

export function teamRows(value) {
  return rows(value).map((item) => item.team || item);
}

export function dateTime(value) {
  if (!value) return "Not scheduled";

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function localDate(value) {
  if (!value) return "";

  const date = new Date(value);
  const adjusted = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );

  return adjusted.toISOString().slice(0, 16);
}

export function pointFrom(values) {
  if (values.longitude === "" || values.latitude === "") {
    throw new Error("Enter both longitude and latitude.");
  }

  const longitude = Number(values.longitude);
  const latitude = Number(values.latitude);

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error("Enter valid location coordinates.");
  }

  return {
    type: "Point",
    coordinates: [longitude, latitude],
  };
}

export function scheduleFrom(values) {
  const start = new Date(values.startsAt);
  const end = new Date(values.endsAt);

  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start ||
    start <= new Date()
  ) {
    throw new Error("Choose a future start and an end after the start.");
  }

  return {
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    venue: {
      name: values.venueName.trim(),
      address: values.address.trim(),
      location: pointFrom(values),
    },
  };
}

export const skillLevels = [
  "Beginner",
  "Intermediate",
  "Advanced",
];
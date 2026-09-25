import { z } from "zod";

export const id = z.string().regex(
  /^[a-fA-F0-9]{24}$/,
  "Invalid ID",
);

export const text = (max) =>
  z.string().trim().min(1).max(max);

export const page = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20),
});

export const point = z.strictObject({
  type: z.literal("Point").default("Point"),

  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});

export const venue = z.strictObject({
  name: text(120),
  address: text(250),
  location: point,
});

export const time = z.iso.datetime({
  offset: true,
});

export const schedule = z.strictObject({
  startsAt: time,
  endsAt: time,
  venue,
}).refine(
  (value) =>
    Date.parse(value.startsAt) > Date.now() &&
    Date.parse(value.endsAt) > Date.parse(value.startsAt),
  {
    message: "Use a future start and an end after the start",
  },
);

export const nonEmpty = (schema) =>
  schema.refine(
    (value) => Object.keys(value).length > 0,
    {
      message: "Provide at least one field",
    },
  );
import mongoose from "mongoose";

export const ref = (name, required = true) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: name,
  required,
});

export const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },

    coordinates: {
      type: [Number],
      required: true,

      validate: (value) =>
        value.length === 2 &&
        value[0] >= -180 &&
        value[0] <= 180 &&
        value[1] >= -90 &&
        value[1] <= 90,
    },
  },
  { _id: false },
);

export const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: { type: pointSchema, required: true },
  },
  { _id: false },
);

export function model(name, fields, indexes = []) {
  const schema = new mongoose.Schema(fields, {
    timestamps: true,

    toJSON: {
      transform(_document, object) {
        delete object.__v;
        return object;
      },
    },
  });

  for (const [keys, options] of indexes) {
    schema.index(keys, options);
  }

  return mongoose.model(name, schema);
}
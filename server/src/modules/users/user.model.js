import { model, pointSchema } from "../../utils/model.js";

const User = model(
  "User",
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      maxlength: 254,
    },

    googleId: { type: String, select: false },

    passwordHash: {
      type: String,
      select: false,
    },

    avatarUrl: { type: String, default: null },
    bio: { type: String, default: "", maxlength: 300 },
    city: { type: String, default: "", maxlength: 100 },
    state: { type: String, default: "", maxlength: 100 },
    postalCode: { type: String, default: "", maxlength: 20 },
    country: { type: String, default: "", maxlength: 100 },

    location: {
      type: pointSchema,
      default: undefined,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: { type: Boolean, default: true },

    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  [
    [{ location: "2dsphere" }, {}],
    [{ googleId: 1 }, { unique: true, sparse: true }],
  ],
);

User.schema.set("toJSON", {
  transform(_document, object) {
    delete object.passwordHash;
    delete object.tokenVersion;
    delete object.__v;
    return object;
  },
});

export default User;

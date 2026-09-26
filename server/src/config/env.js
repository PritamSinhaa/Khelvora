import "dotenv/config";
import { z } from "zod";

const result = z.object({
  NODE_ENV: z.enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  CLIENT_ORIGIN: z.url().default("http://localhost:5173"),

  MONGODB_URI: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GEOAPIFY_API_KEY: z.string().optional(),
  OPEN_GAME_WAITLIST_OFFER_MINUTES: z.coerce.number().int().min(1).max(120).default(15),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
}).safeParse(process.env);

if (!result.success) {
  const fields = result.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");

  throw new Error(`Invalid environment fields: ${fields}`);
}

const config = result.data;

export const env = {
  nodeEnv: config.NODE_ENV,
  port: config.PORT,
  clientOrigin: config.CLIENT_ORIGIN,
  mongodbUri: config.MONGODB_URI,
  jwtSecret: config.JWT_SECRET,
  googleClientId: config.GOOGLE_CLIENT_ID,
  geoapifyApiKey: config.GEOAPIFY_API_KEY,
  openGameWaitlistOfferMinutes: config.OPEN_GAME_WAITLIST_OFFER_MINUTES,
  cloudName: config.CLOUDINARY_CLOUD_NAME,
  cloudKey: config.CLOUDINARY_API_KEY,
  cloudSecret: config.CLOUDINARY_API_SECRET,
};

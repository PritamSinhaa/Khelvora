import { v2 as cloudinary } from "cloudinary";

import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.cloudName,
  api_key: env.cloudKey,
  api_secret: env.cloudSecret,
  secure: true,
});

export default cloudinary;
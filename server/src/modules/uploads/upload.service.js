import cloudinary from "../../config/cloudinary.js";
import { env } from "../../config/env.js";

import Upload from "./upload.model.js";
import User from "../users/user.model.js";
import AppError from "../../utils/AppError.js";

export async function create(user, file) {
  if (!file) {
    throw new AppError("Choose an image file.", 400);
  }

  if (!env.cloudName || !env.cloudKey || !env.cloudSecret) {
    throw new AppError("Uploads are not configured.", 503);
  }

  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `khelvora/${user.id}`,
        resource_type: "image",
        allowed_formats: ["jpg", "png", "webp"],

        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
          },
        ],
      },

      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", {
            message: error.message,
            httpCode: error.http_code,
            name: error.name,
          });

          reject(new AppError("Image upload failed.", 400));
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });

  try {
    return await Upload.create({
      owner: user._id,
      publicId: uploaded.public_id,
      url: uploaded.secure_url,
    });
  } catch (error) {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => {});

    throw error;
  }
}

export async function useAvatar(user, id) {
  const upload = await Upload.findOne({
    _id: id,
    owner: user._id,
  });

  if (!upload) {
    throw new AppError("Upload not found.", 404);
  }

  await User.updateOne({ _id: user._id }, { $set: { avatarUrl: upload.url } });

  return { avatarUrl: upload.url };
}

import multer from "multer";

import moduleRouter from "../../utils/router.js";
import validate from "../../middleware/validate.js";
import AppError from "../../utils/AppError.js";

import * as controller from "./upload.controller.js";
import * as validation from "./upload.validation.js";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter(req, file, callback) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new AppError("Use JPEG, PNG or WebP.", 400),
      );
    }

    callback(null, true);
  },
});

const router = moduleRouter();

router.post("/", upload.single("image"), controller.create);

router.put(
  "/avatar",
  validate(validation.useAvatar),
  controller.useAvatar,
);

export default router;
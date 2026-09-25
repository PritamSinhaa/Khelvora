import AppError from "../utils/AppError.js";
import { logger } from "../utils/logger.js";

export default function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let status = 500;
  let message = "Something went wrong.";
  let details;

  if (error instanceof AppError) {
    status = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error.code === 11000) {
    status = 409;
    message = "A record with these unique values already exists.";
  } else if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    status = 400;
    message = "Invalid data.";
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON in request body.";
  } else if (
    error.type === "entity.too.large" ||
    error.code === "LIMIT_FILE_SIZE"
  ) {
    status = 413;
    message = "Request is too large.";
  } else if (error.name === "MulterError") {
    status = 400;
    message = "Invalid upload.";
  }

  if (status >= 500) {
    logger.error("Request failed", error);
    message = "Service unavailable. Please try again.";
  }

  return res.status(status).json({
    success: false,
    message,

    ...(details
      ? {
          errors: details,
          details,
        }
      : {}),
  });
}
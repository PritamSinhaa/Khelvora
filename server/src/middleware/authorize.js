import AppError from "../utils/AppError.js";

export default function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError("Permission denied.", 403));
    }

    next();
  };
}
import AppError from "../utils/AppError.js";

export default function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return next(new AppError("Validation failed.", 400, details));
    }

    // Express 5 exposes req.query as a getter.
    req.validated ??= {};
    req.validated[source] = result.data;

    next();
  };
}

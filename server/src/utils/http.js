export function respond(handler, statusCode = 200) {
  return async (req, res, next) => {
    try {
      const data = await handler(req);

      return res.status(statusCode).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export function pageOptions(query) {
  return {
    skip: (query.page - 1) * query.limit,
    limit: query.limit,
  };
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
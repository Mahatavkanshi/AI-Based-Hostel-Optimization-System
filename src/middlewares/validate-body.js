const ApiError = require("../utils/api-error");

const validateBody = (requiredFields) => (req, res, next) => {
  const missingFields = requiredFields.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    return next(new ApiError(400, `Missing required fields: ${missingFields.join(", ")}`));
  }

  return next();
};

module.exports = validateBody;

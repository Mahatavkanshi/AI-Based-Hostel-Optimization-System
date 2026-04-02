const ApiError = require("../utils/api-error");

const requireRole = (...roleCodes) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication is required"));
  }

  const userRoles = req.user.roles.map((userRole) => userRole.role.code);
  const hasRole = roleCodes.some((roleCode) => userRoles.includes(roleCode));

  if (!hasRole) {
    return next(new ApiError(403, "You do not have permission to access this resource"));
  }

  return next();
};

module.exports = requireRole;

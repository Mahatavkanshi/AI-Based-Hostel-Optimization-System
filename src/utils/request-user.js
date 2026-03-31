const ApiError = require("./api-error");

const getUserRoleCodes = (user) => user.roles.map((userRole) => userRole.role.code);

const isStudentUser = (user) => getUserRoleCodes(user).includes("STUDENT");

const isStaffManager = (user) => {
  const roleCodes = getUserRoleCodes(user);
  return roleCodes.includes("ADMIN") || roleCodes.includes("WARDEN");
};

const getStudentProfileId = (user) => {
  if (!user?.studentProfile?.id) {
    throw new ApiError(403, "Student profile is required for this action");
  }

  return user.studentProfile.id;
};

const getStaffProfileId = (user) => {
  if (!user?.staffProfile?.id) {
    throw new ApiError(403, "Staff profile is required for this action");
  }

  return user.staffProfile.id;
};

module.exports = {
  getUserRoleCodes,
  isStudentUser,
  isStaffManager,
  getStudentProfileId,
  getStaffProfileId,
};

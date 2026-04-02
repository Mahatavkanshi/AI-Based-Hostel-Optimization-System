const sanitizeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  status: user.status,
  roles: user.roles.map((userRole) => userRole.role.code),
  studentProfile: user.studentProfile,
  staffProfile: user.staffProfile,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = sanitizeUser;

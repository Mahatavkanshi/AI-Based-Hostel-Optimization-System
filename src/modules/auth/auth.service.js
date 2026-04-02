const bcrypt = require("bcryptjs");
const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");
const { signAccessToken } = require("../../utils/jwt");
const sanitizeUser = require("../../utils/sanitize-user");
const userService = require("../users/user.service");

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      studentProfile: true,
      staffProfile: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    userId: user.id,
    roles: user.roles.map((userRole) => userRole.role.code),
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      studentProfile: true,
      staffProfile: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return sanitizeUser(user);
};

const signupStudent = async (payload) => {
  const user = await userService.createStudent(payload);

  return user;
};

module.exports = {
  login,
  getCurrentUser,
  signupStudent,
};

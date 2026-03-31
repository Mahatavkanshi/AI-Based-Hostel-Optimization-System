const prisma = require("../lib/prisma");
const ApiError = require("../utils/api-error");
const { verifyAccessToken } = require("../utils/jwt");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token is missing");
    }

    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      throw new ApiError(401, "User not found for this token");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = auth;

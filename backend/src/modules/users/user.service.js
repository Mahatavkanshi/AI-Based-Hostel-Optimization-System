const bcrypt = require("bcryptjs");
const { Prisma } = require("@prisma/client");
const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");
const sanitizeUser = require("../../utils/sanitize-user");

const buildStoredFileUrl = (file) => {
  if (!file) {
    return null;
  }

  const normalizedPath = file.path.split("\\").join("/");
  const uploadsIndex = normalizedPath.indexOf("uploads/");

  if (uploadsIndex === -1) {
    return null;
  }

  return `/${normalizedPath.slice(uploadsIndex)}`;
};

const userInclude = {
  roles: {
    include: {
      role: true,
    },
  },
  studentProfile: true,
  staffProfile: true,
};

const duplicateFieldMessages = {
  email: "This email is already registered.",
  phone: "This phone number is already registered.",
  rollNumber: "This roll number is already registered.",
  registrationNumber: "This registration number is already registered.",
  employeeId: "This employee ID is already registered.",
};

const handlePrismaWriteError = (error) => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target) ? error.meta.target[0] : null;
    throw new ApiError(409, duplicateFieldMessages[target] || "A record with this value already exists.");
  }

  throw error;
};

const getRolesByCodes = async (roleCodes) => {
  const roles = await prisma.role.findMany({
    where: {
      code: {
        in: roleCodes,
      },
    },
  });

  if (roles.length !== roleCodes.length) {
    throw new ApiError(400, "One or more roles are invalid");
  }

  return roles;
};

const ensureHostelExists = async (assignedHostelId) => {
  if (!assignedHostelId) {
    return null;
  }

  const hostel = await prisma.hostel.findUnique({
    where: { id: assignedHostelId },
  });

  if (!hostel) {
    throw new ApiError(400, "Assigned hostel was not found");
  }

  return hostel;
};

const listUsers = async () => {
  const users = await prisma.user.findMany({
    include: userInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map(sanitizeUser);
};

const createStudent = async (payload) => {
  const {
    fullName,
    email,
    phone,
    password,
    rollNumber,
    registrationNumber,
    gender,
    dateOfBirth,
    department,
    course,
    yearOfStudy,
    semester,
    guardianName,
    guardianPhone,
    address,
    profilePhotoFile,
    faceVerified,
    faceMatchScore,
    faceVerifiedAt,
  } = payload;

  if (!fullName || !email || !password || !rollNumber || !gender || !department || !course || !yearOfStudy) {
    throw new ApiError(400, "Missing required student fields");
  }

  const role = await prisma.role.findUnique({
    where: { code: "STUDENT" },
  });

  if (!role) {
    throw new ApiError(500, "STUDENT role is not seeded yet");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;

  try {
    user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          roles: {
            create: {
              roleId: role.id,
            },
          },
          studentProfile: {
            create: {
              rollNumber,
              registrationNumber,
              profilePhotoUrl: buildStoredFileUrl(profilePhotoFile),
              faceVerified: faceVerified === true || faceVerified === "true",
              faceMatchScore: faceMatchScore !== undefined && faceMatchScore !== null ? Number(faceMatchScore) : null,
              faceVerifiedAt: faceVerifiedAt ? new Date(faceVerifiedAt) : null,
              gender,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              department,
              course,
              yearOfStudy: Number(yearOfStudy),
              semester: semester ? Number(semester) : null,
              guardianName,
              guardianPhone,
              address,
            },
          },
        },
        include: userInclude,
      });

      return createdUser;
    });
  } catch (error) {
    handlePrismaWriteError(error);
  }

  return sanitizeUser(user);
};

const createStaff = async (payload) => {
  const {
    fullName,
    email,
    phone,
    password,
    employeeId,
    gender,
    designation,
    joiningDate,
    assignedHostelId,
    roleCodes,
  } = payload;

  if (!fullName || !email || !password || !employeeId || !designation || !Array.isArray(roleCodes) || roleCodes.length === 0) {
    throw new ApiError(400, "Missing required staff fields");
  }

  const filteredRoleCodes = [...new Set(roleCodes.map((roleCode) => String(roleCode).toUpperCase()))];

  if (filteredRoleCodes.includes("STUDENT")) {
    throw new ApiError(400, "Staff account cannot use STUDENT role");
  }

  const roles = await getRolesByCodes(filteredRoleCodes);
  await ensureHostelExists(assignedHostelId);

  const passwordHash = await bcrypt.hash(password, 10);

  let user;

  try {
    user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName,
          email,
          phone,
          passwordHash,
          roles: {
            create: roles.map((role) => ({
              roleId: role.id,
            })),
          },
          staffProfile: {
            create: {
              employeeId,
              gender,
              designation,
              joiningDate: joiningDate ? new Date(joiningDate) : null,
              assignedHostelId: assignedHostelId || null,
            },
          },
        },
        include: userInclude,
      });

      return createdUser;
    });
  } catch (error) {
    handlePrismaWriteError(error);
  }

  return sanitizeUser(user);
};

const listReferenceData = async () => {
  const [roles, hostels] = await Promise.all([
    prisma.role.findMany({
      orderBy: { code: "asc" },
    }),
    prisma.hostel.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        capacity: true,
      },
    }),
  ]);

  return { roles, hostels };
};

module.exports = {
  listUsers,
  createStudent,
  createStaff,
  listReferenceData,
};

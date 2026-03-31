const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");

const leaveInclude = {
  student: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  approvedBy: {
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
};

const ensureStudentExists = async (studentId) => {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return student;
};

const ensureLeaveExists = async (leaveId) => {
  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: leaveInclude,
  });

  if (!leave) {
    throw new ApiError(404, "Leave request not found");
  }

  return leave;
};

const listLeaves = async ({ requester, status }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (requester.studentProfile?.id) {
    where.studentId = requester.studentProfile.id;
  }

  return prisma.leaveRequest.findMany({
    where,
    include: leaveInclude,
    orderBy: [{ createdAt: "desc" }],
  });
};

const createLeave = async ({ studentId, reason, fromDate, toDate }) => {
  if (!reason || !fromDate || !toDate) {
    throw new ApiError(400, "reason, fromDate, and toDate are required");
  }

  await ensureStudentExists(studentId);

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new ApiError(400, "fromDate and toDate must be valid dates");
  }

  if (to < from) {
    throw new ApiError(400, "toDate cannot be earlier than fromDate");
  }

  return prisma.leaveRequest.create({
    data: {
      studentId,
      reason,
      fromDate: from,
      toDate: to,
    },
    include: leaveInclude,
  });
};

const reviewLeave = async ({ leaveId, approvedById, status }) => {
  if (!["APPROVED", "REJECTED", "RETURNED"].includes(status)) {
    throw new ApiError(400, "status must be APPROVED, REJECTED, or RETURNED");
  }

  const leave = await ensureLeaveExists(leaveId);

  if (status !== "RETURNED" && leave.status !== "PENDING") {
    throw new ApiError(400, "Only pending leave requests can be approved or rejected");
  }

  if (status === "RETURNED" && leave.status !== "APPROVED") {
    throw new ApiError(400, "Only approved leave requests can be marked as returned");
  }

  return prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status,
      approvedById,
      approvedAt: new Date(),
    },
    include: leaveInclude,
  });
};

module.exports = {
  listLeaves,
  createLeave,
  reviewLeave,
};

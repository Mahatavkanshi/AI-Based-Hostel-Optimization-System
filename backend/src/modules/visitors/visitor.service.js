const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");

const visitorRequestInclude = {
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
  visitor: true,
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
  entryLogs: {
    include: {
      gatekeeper: {
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
    },
    orderBy: { createdAt: "desc" },
  },
};

const entryLogInclude = {
  request: {
    include: {
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
      visitor: true,
    },
  },
  gatekeeper: {
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
  const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return student;
};

const ensureVisitorRequestExists = async (requestId) => {
  const request = await prisma.visitorPassRequest.findUnique({
    where: { id: requestId },
    include: visitorRequestInclude,
  });

  if (!request) {
    throw new ApiError(404, "Visitor request not found");
  }

  return request;
};

const listVisitorRequests = async ({ requester, status }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (requester.studentProfile?.id) {
    where.studentId = requester.studentProfile.id;
  }

  return prisma.visitorPassRequest.findMany({
    where,
    include: visitorRequestInclude,
    orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
  });
};

const createVisitorRequest = async ({ studentId, visitorData, visitDate, purpose }) => {
  if (!visitorData?.fullName || !visitDate) {
    throw new ApiError(400, "visitor fullName and visitDate are required");
  }

  await ensureStudentExists(studentId);

  const visit = new Date(visitDate);

  if (Number.isNaN(visit.getTime())) {
    throw new ApiError(400, "visitDate must be a valid date");
  }

  const existingPending = await prisma.visitorPassRequest.findFirst({
    where: {
      studentId,
      visitDate: visit,
      status: "PENDING",
      visitor: {
        fullName: visitorData.fullName,
      },
    },
  });

  if (existingPending) {
    throw new ApiError(400, "A pending visitor request already exists for this visitor and date");
  }

  return prisma.visitorPassRequest.create({
    data: {
      studentId,
      visitDate: visit,
      purpose: purpose || null,
      visitor: {
        create: {
          fullName: visitorData.fullName,
          phone: visitorData.phone || null,
          idProofType: visitorData.idProofType || null,
          idProofNumber: visitorData.idProofNumber || null,
          relationToStudent: visitorData.relationToStudent || null,
        },
      },
    },
    include: visitorRequestInclude,
  });
};

const reviewVisitorRequest = async ({ requestId, approvedById, status }) => {
  if (!["APPROVED", "REJECTED", "EXPIRED"].includes(status)) {
    throw new ApiError(400, "status must be APPROVED, REJECTED, or EXPIRED");
  }

  const request = await ensureVisitorRequestExists(requestId);

  if (request.status !== "PENDING") {
    throw new ApiError(400, "Only pending visitor requests can be reviewed");
  }

  return prisma.visitorPassRequest.update({
    where: { id: requestId },
    data: {
      status,
      approvedById,
      approvedAt: new Date(),
    },
    include: visitorRequestInclude,
  });
};

const listEntryLogs = async ({ requester }) => {
  const where = {};

  if (requester.studentProfile?.id) {
    where.request = {
      studentId: requester.studentProfile.id,
    };
  }

  return prisma.visitorEntryLog.findMany({
    where,
    include: entryLogInclude,
    orderBy: [{ createdAt: "desc" }],
  });
};

const recordCheckIn = async ({ requestId, gatekeeperId, remarks }) => {
  const request = await ensureVisitorRequestExists(requestId);

  if (request.status !== "APPROVED") {
    throw new ApiError(400, "Only approved visitor requests can be checked in");
  }

  const openLog = await prisma.visitorEntryLog.findFirst({
    where: {
      requestId,
      checkOutTime: null,
    },
  });

  if (openLog) {
    throw new ApiError(400, "This visitor already has an active check-in record");
  }

  return prisma.visitorEntryLog.create({
    data: {
      requestId,
      gatekeeperId,
      checkInTime: new Date(),
      remarks: remarks || null,
    },
    include: entryLogInclude,
  });
};

const recordCheckOut = async ({ entryLogId, gatekeeperId, remarks }) => {
  const entryLog = await prisma.visitorEntryLog.findUnique({
    where: { id: entryLogId },
    include: entryLogInclude,
  });

  if (!entryLog) {
    throw new ApiError(404, "Visitor entry log not found");
  }

  if (entryLog.checkOutTime) {
    throw new ApiError(400, "Visitor has already checked out");
  }

  return prisma.visitorEntryLog.update({
    where: { id: entryLogId },
    data: {
      gatekeeperId,
      checkOutTime: new Date(),
      remarks: remarks || entryLog.remarks,
    },
    include: entryLogInclude,
  });
};

module.exports = {
  listVisitorRequests,
  createVisitorRequest,
  reviewVisitorRequest,
  listEntryLogs,
  recordCheckIn,
  recordCheckOut,
};

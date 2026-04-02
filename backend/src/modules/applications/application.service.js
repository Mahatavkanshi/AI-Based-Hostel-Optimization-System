const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");

const applicationInclude = {
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
  preferredHostel: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
    },
  },
  allocations: {
    include: {
      bed: {
        include: {
          room: {
            include: {
              floor: {
                include: {
                  block: {
                    include: {
                      hostel: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
};

const allocationInclude = {
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
  application: {
    include: {
      preferredHostel: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
  bed: {
    include: {
      room: {
        include: {
          floor: {
            include: {
              block: {
                include: {
                  hostel: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const ensureHostelExists = async (hostelId) => {
  if (!hostelId) {
    return null;
  }

  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });

  if (!hostel) {
    throw new ApiError(400, "Preferred hostel not found");
  }

  return hostel;
};

const ensureStudentExists = async (studentId) => {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
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
  });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return student;
};

const ensureApplicationExists = async (applicationId) => {
  const application = await prisma.hostelApplication.findUnique({
    where: { id: applicationId },
    include: applicationInclude,
  });

  if (!application) {
    throw new ApiError(404, "Hostel application not found");
  }

  return application;
};

const ensureBedAvailable = async (bedId) => {
  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: {
      room: true,
      allocations: {
        where: {
          status: "ACTIVE",
        },
      },
    },
  });

  if (!bed) {
    throw new ApiError(404, "Bed not found");
  }

  if (bed.status !== "AVAILABLE") {
    throw new ApiError(400, "Bed is not available for allocation");
  }

  if (bed.allocations.length > 0) {
    throw new ApiError(400, "Bed already has an active allocation");
  }

  if (bed.room.currentOccupancy >= bed.room.capacity) {
    throw new ApiError(400, "Room is already at full capacity");
  }

  return bed;
};

const ensureStudentHasNoActiveAllocation = async (studentId) => {
  const activeAllocation = await prisma.allocation.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
    },
  });

  if (activeAllocation) {
    throw new ApiError(400, "Student already has an active bed allocation");
  }
};

const listApplications = async ({ requester, status }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (requester.studentProfile?.id) {
    where.studentId = requester.studentProfile.id;
  }

  return prisma.hostelApplication.findMany({
    where,
    include: applicationInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};

const createApplication = async ({ studentId, preferredHostelId, academicYear, reason }) => {
  if (!academicYear) {
    throw new ApiError(400, "academicYear is required");
  }

  await ensureStudentExists(studentId);
  await ensureHostelExists(preferredHostelId);

  const existingPending = await prisma.hostelApplication.findFirst({
    where: {
      studentId,
      status: "PENDING",
    },
  });

  if (existingPending) {
    throw new ApiError(400, "A pending hostel application already exists for this student");
  }

  return prisma.hostelApplication.create({
    data: {
      studentId,
      preferredHostelId: preferredHostelId || null,
      academicYear,
      reason: reason || null,
    },
    include: applicationInclude,
  });
};

const reviewApplication = async ({ applicationId, reviewedById, status }) => {
  if (!["APPROVED", "REJECTED", "WAITLISTED"].includes(status)) {
    throw new ApiError(400, "Review status must be APPROVED, REJECTED, or WAITLISTED");
  }

  const application = await ensureApplicationExists(applicationId);

  if (application.status !== "PENDING") {
    throw new ApiError(400, "Only pending applications can be reviewed");
  }

  return prisma.hostelApplication.update({
    where: { id: applicationId },
    data: {
      status,
      reviewedById,
      reviewedAt: new Date(),
    },
    include: applicationInclude,
  });
};

const createAllocation = async ({ applicationId, bedId, startDate }) => {
  if (!bedId || !startDate) {
    throw new ApiError(400, "bedId and startDate are required");
  }

  const application = await ensureApplicationExists(applicationId);
  const studentId = application.studentId;

  if (application.status !== "APPROVED") {
    throw new ApiError(400, "Only approved applications can be allocated");
  }

  await ensureStudentExists(studentId);
  const bed = await ensureBedAvailable(bedId);
  await ensureStudentHasNoActiveAllocation(studentId);

  const allocation = await prisma.$transaction(async (tx) => {
    const createdAllocation = await tx.allocation.create({
      data: {
        studentId,
        applicationId,
        bedId,
        startDate: new Date(startDate),
        status: "ACTIVE",
      },
      include: allocationInclude,
    });

    await tx.bed.update({
      where: { id: bedId },
      data: { status: "OCCUPIED" },
    });

    await tx.room.update({
      where: { id: bed.roomId },
      data: {
        currentOccupancy: {
          increment: 1,
        },
      },
    });

    return createdAllocation;
  });

  return allocation;
};

const listAllocations = async ({ requester }) => {
  const where = {};

  if (requester.studentProfile?.id) {
    where.studentId = requester.studentProfile.id;
  }

  return prisma.allocation.findMany({
    where,
    include: allocationInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
};

const completeAllocation = async ({ allocationId, endDate }) => {
  const allocation = await prisma.allocation.findUnique({
    where: { id: allocationId },
    include: {
      bed: true,
    },
  });

  if (!allocation) {
    throw new ApiError(404, "Allocation not found");
  }

  if (allocation.status !== "ACTIVE") {
    throw new ApiError(400, "Only active allocations can be completed");
  }

  const updatedAllocation = await prisma.$transaction(async (tx) => {
    const completed = await tx.allocation.update({
      where: { id: allocationId },
      data: {
        status: "COMPLETED",
        endDate: endDate ? new Date(endDate) : new Date(),
      },
      include: allocationInclude,
    });

    await tx.bed.update({
      where: { id: allocation.bedId },
      data: { status: "AVAILABLE" },
    });

    await tx.room.update({
      where: { id: allocation.bed.roomId },
      data: {
        currentOccupancy: {
          decrement: 1,
        },
      },
    });

    return completed;
  });

  return updatedAllocation;
};

module.exports = {
  listApplications,
  createApplication,
  reviewApplication,
  createAllocation,
  listAllocations,
  completeAllocation,
};

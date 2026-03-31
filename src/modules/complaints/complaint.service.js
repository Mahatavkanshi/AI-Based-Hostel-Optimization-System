const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");

const complaintInclude = {
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
  assignedTo: {
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
  updates: {
    orderBy: { createdAt: "asc" },
  },
};

const ensureStudentExists = async (studentId) => {
  const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return student;
};

const ensureStaffExists = async (staffId) => {
  if (!staffId) {
    return null;
  }

  const staff = await prisma.staffProfile.findUnique({ where: { id: staffId } });

  if (!staff) {
    throw new ApiError(404, "Staff profile not found");
  }

  return staff;
};

const ensureComplaintExists = async (complaintId) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: complaintInclude,
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  return complaint;
};

const listComplaints = async ({ requester, status }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (requester.studentProfile?.id) {
    where.studentId = requester.studentProfile.id;
  }

  return prisma.complaint.findMany({
    where,
    include: complaintInclude,
    orderBy: [{ createdAt: "desc" }],
  });
};

const createComplaint = async ({ studentId, title, description, category, priority }) => {
  if (!title || !description || !category) {
    throw new ApiError(400, "title, description, and category are required");
  }

  await ensureStudentExists(studentId);

  return prisma.complaint.create({
    data: {
      studentId,
      title,
      description,
      category,
      priority: priority || "MEDIUM",
      updates: {
        create: {
          message: "Complaint created",
          status: "OPEN",
        },
      },
    },
    include: complaintInclude,
  });
};

const assignComplaint = async ({ complaintId, assignedToId }) => {
  if (!assignedToId) {
    throw new ApiError(400, "assignedToId is required");
  }

  await ensureStaffExists(assignedToId);
  await ensureComplaintExists(complaintId);

  return prisma.complaint.update({
    where: { id: complaintId },
    data: {
      assignedToId,
      status: "IN_PROGRESS",
      updates: {
        create: {
          message: "Complaint assigned to staff member",
          status: "IN_PROGRESS",
        },
      },
    },
    include: complaintInclude,
  });
};

const addComplaintUpdate = async ({ complaintId, message, status }) => {
  if (!message) {
    throw new ApiError(400, "message is required");
  }

  const complaint = await ensureComplaintExists(complaintId);

  const nextStatus = status || complaint.status;

  return prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status: nextStatus,
      updates: {
        create: {
          message,
          status: status || null,
        },
      },
    },
    include: complaintInclude,
  });
};

const getComplaintReferenceData = async () => {
  const staff = await prisma.staffProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { employeeId: "asc" },
  });

  return {
    categories: ["MAINTENANCE", "ELECTRICAL", "PLUMBING", "CLEANLINESS", "DISCIPLINE", "OTHER"],
    priorities: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    statuses: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    staff,
  };
};

module.exports = {
  listComplaints,
  createComplaint,
  assignComplaint,
  addComplaintUpdate,
  getComplaintReferenceData,
};

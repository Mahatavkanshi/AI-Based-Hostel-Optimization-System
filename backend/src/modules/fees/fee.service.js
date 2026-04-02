const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");

const feeStructureInclude = {
  hostel: {
    select: {
      id: true,
      name: true,
      code: true,
      type: true,
    },
  },
};

const invoiceInclude = {
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
  feeStructure: {
    include: feeStructureInclude,
  },
  payments: {
    orderBy: { paymentDate: "desc" },
  },
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
        },
      },
    },
  });

  if (!student) {
    throw new ApiError(404, "Student profile not found");
  }

  return student;
};

const ensureHostelExists = async (hostelId) => {
  if (!hostelId) {
    return null;
  }

  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  return hostel;
};

const ensureFeeStructureExists = async (feeStructureId) => {
  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: feeStructureId },
    include: feeStructureInclude,
  });

  if (!feeStructure) {
    throw new ApiError(404, "Fee structure not found");
  }

  return feeStructure;
};

const ensureInvoiceExists = async (invoiceId) => {
  const invoice = await prisma.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: invoiceInclude,
  });

  if (!invoice) {
    throw new ApiError(404, "Fee invoice not found");
  }

  return invoice;
};

const listFeeStructures = async () =>
  prisma.feeStructure.findMany({
    include: feeStructureInclude,
    orderBy: [{ academicYear: "desc" }, { createdAt: "desc" }],
  });

const createFeeStructure = async (payload) => {
  const {
    hostelId,
    roomType,
    academicYear,
    frequency,
    category,
    amount,
    isActive,
  } = payload;

  if (!academicYear || !frequency || !category || amount === undefined || amount === null) {
    throw new ApiError(400, "academicYear, frequency, category, and amount are required");
  }

  await ensureHostelExists(hostelId);

  return prisma.feeStructure.create({
    data: {
      hostelId: hostelId || null,
      roomType: roomType || null,
      academicYear,
      frequency,
      category,
      amount: String(amount),
      isActive: isActive ?? true,
    },
    include: feeStructureInclude,
  });
};

const listInvoices = async ({ requester, status }) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (requester.studentProfile?.id) {
    where.studentId = requester.studentProfile.id;
  }

  return prisma.feeInvoice.findMany({
    where,
    include: invoiceInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });
};

const buildInvoiceNumber = async () => {
  const count = await prisma.feeInvoice.count();
  return `INV-${String(count + 1).padStart(5, "0")}`;
};

const generateInvoice = async (payload) => {
  const {
    studentId,
    feeStructureId,
    academicYear,
    billingMonth,
    billingSemester,
    amount,
    dueDate,
  } = payload;

  if (!studentId || !academicYear || amount === undefined || amount === null || !dueDate) {
    throw new ApiError(400, "studentId, academicYear, amount, and dueDate are required");
  }

  await ensureStudentExists(studentId);

  if (feeStructureId) {
    await ensureFeeStructureExists(feeStructureId);
  }

  const invoiceNumber = await buildInvoiceNumber();

  return prisma.feeInvoice.create({
    data: {
      studentId,
      feeStructureId: feeStructureId || null,
      invoiceNumber,
      academicYear,
      billingMonth: billingMonth ?? null,
      billingSemester: billingSemester ?? null,
      amount: String(amount),
      dueDate: new Date(dueDate),
      status: "PENDING",
    },
    include: invoiceInclude,
  });
};

const payInvoice = async ({ invoiceId, requester, amountPaid, method, transactionRef }) => {
  if (amountPaid === undefined || amountPaid === null || !method) {
    throw new ApiError(400, "amountPaid and method are required");
  }

  const invoice = await ensureInvoiceExists(invoiceId);

  if (requester.studentProfile?.id && requester.studentProfile.id !== invoice.studentId) {
    throw new ApiError(403, "You can only pay your own invoices");
  }

  const paymentAmount = Number(amountPaid);
  const invoiceAmount = Number(invoice.amount);
  const previousPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amountPaid), 0);
  const remainingAmount = invoiceAmount - previousPaid;

  if (paymentAmount <= 0) {
    throw new ApiError(400, "amountPaid must be greater than zero");
  }

  if (paymentAmount > remainingAmount) {
    throw new ApiError(400, "Payment amount cannot exceed the remaining invoice balance");
  }

  const nextStatus = paymentAmount === remainingAmount ? "PAID" : "PARTIAL";

  return prisma.$transaction(async (tx) => {
    await tx.feePayment.create({
      data: {
        invoiceId,
        studentId: invoice.studentId,
        amountPaid: String(paymentAmount),
        method,
        transactionRef: transactionRef || null,
        status: nextStatus,
      },
    });

    return tx.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        status: nextStatus,
      },
      include: invoiceInclude,
    });
  });
};

const getFeeDashboard = async ({ requester }) => {
  const invoiceWhere = requester.studentProfile?.id
    ? { studentId: requester.studentProfile.id }
    : {};

  const [invoiceCount, pendingCount, totalInvoiced, totalCollected] = await Promise.all([
    prisma.feeInvoice.count({ where: invoiceWhere }),
    prisma.feeInvoice.count({
      where: {
        ...invoiceWhere,
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
    }),
    prisma.feeInvoice.aggregate({
      where: invoiceWhere,
      _sum: { amount: true },
    }),
    prisma.feePayment.aggregate({
      where: requester.studentProfile?.id ? { studentId: requester.studentProfile.id } : {},
      _sum: { amountPaid: true },
    }),
  ]);

  return {
    invoiceCount,
    pendingCount,
    totalInvoiced: totalInvoiced._sum.amount || 0,
    totalCollected: totalCollected._sum.amountPaid || 0,
  };
};

module.exports = {
  listFeeStructures,
  createFeeStructure,
  listInvoices,
  generateInvoice,
  payInvoice,
  getFeeDashboard,
};

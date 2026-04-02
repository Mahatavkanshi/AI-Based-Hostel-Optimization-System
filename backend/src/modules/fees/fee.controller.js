const asyncHandler = require("../../utils/async-handler");
const feeService = require("./fee.service");

const listFeeStructures = asyncHandler(async (req, res) => {
  const structures = await feeService.listFeeStructures();

  res.status(200).json({
    success: true,
    data: structures,
  });
});

const createFeeStructure = asyncHandler(async (req, res) => {
  const structure = await feeService.createFeeStructure(req.body);

  res.status(201).json({
    success: true,
    message: "Fee structure created successfully",
    data: structure,
  });
});

const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await feeService.listInvoices({
    requester: req.user,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    data: invoices,
  });
});

const generateInvoice = asyncHandler(async (req, res) => {
  const invoice = await feeService.generateInvoice(req.body);

  res.status(201).json({
    success: true,
    message: "Fee invoice generated successfully",
    data: invoice,
  });
});

const payInvoice = asyncHandler(async (req, res) => {
  const invoice = await feeService.payInvoice({
    invoiceId: req.params.invoiceId,
    requester: req.user,
    amountPaid: req.body.amountPaid,
    method: req.body.method,
    transactionRef: req.body.transactionRef,
  });

  res.status(200).json({
    success: true,
    message: "Payment recorded successfully",
    data: invoice,
  });
});

const getFeeDashboard = asyncHandler(async (req, res) => {
  const dashboard = await feeService.getFeeDashboard({ requester: req.user });

  res.status(200).json({
    success: true,
    data: dashboard,
  });
});

module.exports = {
  listFeeStructures,
  createFeeStructure,
  listInvoices,
  generateInvoice,
  payInvoice,
  getFeeDashboard,
};

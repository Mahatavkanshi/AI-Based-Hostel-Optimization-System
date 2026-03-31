const asyncHandler = require("../../utils/async-handler");
const { getStaffProfileId, getStudentProfileId } = require("../../utils/request-user");
const visitorService = require("./visitor.service");

const listVisitorRequests = asyncHandler(async (req, res) => {
  const requests = await visitorService.listVisitorRequests({
    requester: req.user,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    data: requests,
  });
});

const createVisitorRequest = asyncHandler(async (req, res) => {
  const request = await visitorService.createVisitorRequest({
    studentId: getStudentProfileId(req.user),
    visitorData: req.body.visitor,
    visitDate: req.body.visitDate,
    purpose: req.body.purpose,
  });

  res.status(201).json({
    success: true,
    message: "Visitor request submitted successfully",
    data: request,
  });
});

const reviewVisitorRequest = asyncHandler(async (req, res) => {
  const request = await visitorService.reviewVisitorRequest({
    requestId: req.params.requestId,
    approvedById: getStaffProfileId(req.user),
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    message: "Visitor request updated successfully",
    data: request,
  });
});

const listEntryLogs = asyncHandler(async (req, res) => {
  const logs = await visitorService.listEntryLogs({ requester: req.user });

  res.status(200).json({
    success: true,
    data: logs,
  });
});

const recordCheckIn = asyncHandler(async (req, res) => {
  const log = await visitorService.recordCheckIn({
    requestId: req.body.requestId,
    gatekeeperId: getStaffProfileId(req.user),
    remarks: req.body.remarks,
  });

  res.status(201).json({
    success: true,
    message: "Visitor check-in recorded successfully",
    data: log,
  });
});

const recordCheckOut = asyncHandler(async (req, res) => {
  const log = await visitorService.recordCheckOut({
    entryLogId: req.params.entryLogId,
    gatekeeperId: getStaffProfileId(req.user),
    remarks: req.body.remarks,
  });

  res.status(200).json({
    success: true,
    message: "Visitor check-out recorded successfully",
    data: log,
  });
});

module.exports = {
  listVisitorRequests,
  createVisitorRequest,
  reviewVisitorRequest,
  listEntryLogs,
  recordCheckIn,
  recordCheckOut,
};

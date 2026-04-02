const asyncHandler = require("../../utils/async-handler");
const { getStaffProfileId, getStudentProfileId } = require("../../utils/request-user");
const leaveService = require("./leave.service");

const listLeaves = asyncHandler(async (req, res) => {
  const leaves = await leaveService.listLeaves({
    requester: req.user,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    data: leaves,
  });
});

const createLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.createLeave({
    studentId: getStudentProfileId(req.user),
    reason: req.body.reason,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
  });

  res.status(201).json({
    success: true,
    message: "Leave request submitted successfully",
    data: leave,
  });
});

const reviewLeave = asyncHandler(async (req, res) => {
  const leave = await leaveService.reviewLeave({
    leaveId: req.params.leaveId,
    approvedById: getStaffProfileId(req.user),
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    message: "Leave request updated successfully",
    data: leave,
  });
});

module.exports = {
  listLeaves,
  createLeave,
  reviewLeave,
};

const asyncHandler = require("../../utils/async-handler");
const { getStudentProfileId } = require("../../utils/request-user");
const complaintService = require("./complaint.service");

const listComplaints = asyncHandler(async (req, res) => {
  const complaints = await complaintService.listComplaints({
    requester: req.user,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    data: complaints,
  });
});

const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.createComplaint({
    studentId: getStudentProfileId(req.user),
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    priority: req.body.priority,
  });

  res.status(201).json({
    success: true,
    message: "Complaint submitted successfully",
    data: complaint,
  });
});

const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await complaintService.assignComplaint({
    complaintId: req.params.complaintId,
    assignedToId: req.body.assignedToId,
  });

  res.status(200).json({
    success: true,
    message: "Complaint assigned successfully",
    data: complaint,
  });
});

const addComplaintUpdate = asyncHandler(async (req, res) => {
  const complaint = await complaintService.addComplaintUpdate({
    complaintId: req.params.complaintId,
    message: req.body.message,
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    message: "Complaint updated successfully",
    data: complaint,
  });
});

const getComplaintReferenceData = asyncHandler(async (req, res) => {
  const data = await complaintService.getComplaintReferenceData();

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  listComplaints,
  createComplaint,
  assignComplaint,
  addComplaintUpdate,
  getComplaintReferenceData,
};

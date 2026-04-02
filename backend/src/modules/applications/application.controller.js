const asyncHandler = require("../../utils/async-handler");
const applicationService = require("./application.service");
const { getStudentProfileId } = require("../../utils/request-user");

const listApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.listApplications({
    requester: req.user,
    status: req.query.status,
  });

  res.status(200).json({
    success: true,
    data: applications,
  });
});

const createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication({
    studentId: getStudentProfileId(req.user),
    preferredHostelId: req.body.preferredHostelId,
    academicYear: req.body.academicYear,
    reason: req.body.reason,
  });

  res.status(201).json({
    success: true,
    message: "Hostel application submitted successfully",
    data: application,
  });
});

const reviewApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.reviewApplication({
    applicationId: req.params.applicationId,
    reviewedById: req.user.staffProfile?.id || req.user.id,
    status: req.body.status,
  });

  res.status(200).json({
    success: true,
    message: "Hostel application reviewed successfully",
    data: application,
  });
});

const listAllocations = asyncHandler(async (req, res) => {
  const allocations = await applicationService.listAllocations({
    requester: req.user,
  });

  res.status(200).json({
    success: true,
    data: allocations,
  });
});

const createAllocation = asyncHandler(async (req, res) => {
  const allocation = await applicationService.createAllocation({
    applicationId: req.body.applicationId,
    bedId: req.body.bedId,
    startDate: req.body.startDate,
  });

  res.status(201).json({
    success: true,
    message: "Bed allocated successfully",
    data: allocation,
  });
});

const completeAllocation = asyncHandler(async (req, res) => {
  const allocation = await applicationService.completeAllocation({
    allocationId: req.params.allocationId,
    endDate: req.body.endDate,
  });

  res.status(200).json({
    success: true,
    message: "Allocation completed successfully",
    data: allocation,
  });
});

module.exports = {
  listApplications,
  createApplication,
  reviewApplication,
  listAllocations,
  createAllocation,
  completeAllocation,
};

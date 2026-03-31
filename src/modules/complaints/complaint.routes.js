const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const validateBody = require("../../middlewares/validate-body");
const complaintController = require("./complaint.controller");

const router = express.Router();

router.use(auth);

router.get("/", requireRole("ADMIN", "WARDEN", "SUPERVISOR", "STUDENT"), complaintController.listComplaints);
router.get("/reference-data", requireRole("ADMIN", "WARDEN", "SUPERVISOR"), complaintController.getComplaintReferenceData);
router.post("/", requireRole("STUDENT"), validateBody(["title", "description", "category"]), complaintController.createComplaint);
router.patch("/:complaintId/assign", requireRole("ADMIN", "WARDEN", "SUPERVISOR"), validateBody(["assignedToId"]), complaintController.assignComplaint);
router.patch("/:complaintId/updates", requireRole("ADMIN", "WARDEN", "SUPERVISOR"), validateBody(["message"]), complaintController.addComplaintUpdate);

module.exports = router;

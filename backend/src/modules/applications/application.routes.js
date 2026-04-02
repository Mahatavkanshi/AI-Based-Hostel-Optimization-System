const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const applicationController = require("./application.controller");

const router = express.Router();

router.use(auth);

router.get("/applications", requireRole("ADMIN", "WARDEN", "STUDENT"), applicationController.listApplications);
router.post("/applications", requireRole("STUDENT"), applicationController.createApplication);
router.patch("/applications/:applicationId/review", requireRole("ADMIN", "WARDEN"), applicationController.reviewApplication);

router.get("/allocations", requireRole("ADMIN", "WARDEN", "STUDENT"), applicationController.listAllocations);
router.post("/allocations", requireRole("ADMIN", "WARDEN"), applicationController.createAllocation);
router.patch("/allocations/:allocationId/complete", requireRole("ADMIN", "WARDEN"), applicationController.completeAllocation);

module.exports = router;

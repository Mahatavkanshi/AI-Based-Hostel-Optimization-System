const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const validateBody = require("../../middlewares/validate-body");
const leaveController = require("./leave.controller");

const router = express.Router();

router.use(auth);

router.get("/", requireRole("ADMIN", "WARDEN", "STUDENT", "GATEKEEPER"), leaveController.listLeaves);
router.post("/", requireRole("STUDENT"), validateBody(["reason", "fromDate", "toDate"]), leaveController.createLeave);
router.patch("/:leaveId/review", requireRole("WARDEN"), validateBody(["status"]), leaveController.reviewLeave);

module.exports = router;

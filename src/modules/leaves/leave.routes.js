const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const leaveController = require("./leave.controller");

const router = express.Router();

router.use(auth);

router.get("/", requireRole("ADMIN", "WARDEN", "STUDENT", "GATEKEEPER"), leaveController.listLeaves);
router.post("/", requireRole("STUDENT"), leaveController.createLeave);
router.patch("/:leaveId/review", requireRole("WARDEN"), leaveController.reviewLeave);

module.exports = router;

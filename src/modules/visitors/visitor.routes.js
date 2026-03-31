const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const validateBody = require("../../middlewares/validate-body");
const visitorController = require("./visitor.controller");

const router = express.Router();

router.use(auth);

router.get("/requests", requireRole("ADMIN", "WARDEN", "STUDENT", "GATEKEEPER"), visitorController.listVisitorRequests);
router.post("/requests", requireRole("STUDENT"), validateBody(["visitor", "visitDate"]), visitorController.createVisitorRequest);
router.patch("/requests/:requestId/review", requireRole("WARDEN"), validateBody(["status"]), visitorController.reviewVisitorRequest);

router.get("/entry-logs", requireRole("ADMIN", "WARDEN", "STUDENT", "GATEKEEPER"), visitorController.listEntryLogs);
router.post("/entry-logs/check-in", requireRole("GATEKEEPER"), validateBody(["requestId"]), visitorController.recordCheckIn);
router.patch("/entry-logs/:entryLogId/check-out", requireRole("GATEKEEPER"), visitorController.recordCheckOut);

module.exports = router;

const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const feeController = require("./fee.controller");

const router = express.Router();

router.use(auth);

router.get("/structures", requireRole("ADMIN", "ACCOUNTANT", "WARDEN"), feeController.listFeeStructures);
router.post("/structures", requireRole("ADMIN", "ACCOUNTANT"), feeController.createFeeStructure);

router.get("/invoices", requireRole("ADMIN", "ACCOUNTANT", "WARDEN", "STUDENT"), feeController.listInvoices);
router.post("/invoices", requireRole("ADMIN", "ACCOUNTANT"), feeController.generateInvoice);
router.post("/invoices/:invoiceId/payments", requireRole("ADMIN", "ACCOUNTANT", "STUDENT"), feeController.payInvoice);

router.get("/dashboard", requireRole("ADMIN", "ACCOUNTANT", "WARDEN", "STUDENT"), feeController.getFeeDashboard);

module.exports = router;

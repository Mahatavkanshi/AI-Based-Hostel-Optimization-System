const express = require("express");
const applicationRoutes = require("../modules/applications/application.routes");
const authRoutes = require("../modules/auth/auth.routes");
const complaintRoutes = require("../modules/complaints/complaint.routes");
const feeRoutes = require("../modules/fees/fee.routes");
const hostelRoutes = require("../modules/hostels/hostel.routes");
const leaveRoutes = require("../modules/leaves/leave.routes");
const userRoutes = require("../modules/users/user.routes");
const visitorRoutes = require("../modules/visitors/visitor.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hostel management backend is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/complaints", complaintRoutes);
router.use("/fees", feeRoutes);
router.use("/leaves", leaveRoutes);
router.use("/visitors", visitorRoutes);
router.use("/hostel-management", applicationRoutes);
router.use("/hostels", hostelRoutes);
router.use("/users", userRoutes);

module.exports = router;

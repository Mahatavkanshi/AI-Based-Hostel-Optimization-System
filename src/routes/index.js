const express = require("express");
const authRoutes = require("../modules/auth/auth.routes");
const userRoutes = require("../modules/users/user.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hostel management backend is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

module.exports = router;

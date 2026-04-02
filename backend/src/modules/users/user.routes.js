const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const userController = require("./user.controller");

const router = express.Router();

router.use(auth, requireRole("ADMIN"));

router.get("/", userController.listUsers);
router.get("/reference-data", userController.getReferenceData);
router.post("/students", userController.createStudent);
router.post("/staff", userController.createStaff);

module.exports = router;

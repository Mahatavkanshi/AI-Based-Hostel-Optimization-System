const express = require("express");
const auth = require("../../middlewares/auth");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", auth, authController.me);

module.exports = router;

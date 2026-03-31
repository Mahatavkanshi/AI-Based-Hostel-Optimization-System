const express = require("express");
const auth = require("../../middlewares/auth");
const validateBody = require("../../middlewares/validate-body");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/login", validateBody(["email", "password"]), authController.login);
router.get("/me", auth, authController.me);

module.exports = router;

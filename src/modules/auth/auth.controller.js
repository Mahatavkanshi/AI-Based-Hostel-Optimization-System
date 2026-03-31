const asyncHandler = require("../../utils/async-handler");
const authService = require("./auth.service");

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = {
  login,
  me,
};

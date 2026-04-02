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

const signupStudent = asyncHandler(async (req, res) => {
  const user = await authService.signupStudent({
    ...req.body,
    profilePhotoFile: req.files?.profilePhoto?.[0],
    liveCapturePhotoFile: req.files?.liveCapturePhoto?.[0],
  });

  res.status(201).json({
    success: true,
    message: "Student account created successfully. Please log in.",
    data: user,
  });
});

module.exports = {
  login,
  me,
  signupStudent,
};

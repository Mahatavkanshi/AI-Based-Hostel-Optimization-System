const asyncHandler = require("../../utils/async-handler");
const userService = require("./user.service");

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();

  res.status(200).json({
    success: true,
    data: users,
  });
});

const createStudent = asyncHandler(async (req, res) => {
  const user = await userService.createStudent(req.body);

  res.status(201).json({
    success: true,
    message: "Student account created successfully",
    data: user,
  });
});

const createStaff = asyncHandler(async (req, res) => {
  const user = await userService.createStaff(req.body);

  res.status(201).json({
    success: true,
    message: "Staff account created successfully",
    data: user,
  });
});

const getReferenceData = asyncHandler(async (req, res) => {
  const data = await userService.listReferenceData();

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = {
  listUsers,
  createStudent,
  createStaff,
  getReferenceData,
};

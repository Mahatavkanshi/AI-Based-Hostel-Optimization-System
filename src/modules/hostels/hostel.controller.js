const asyncHandler = require("../../utils/async-handler");
const hostelService = require("./hostel.service");

const listCampuses = asyncHandler(async (req, res) => {
  const campuses = await hostelService.listCampuses();

  res.status(200).json({
    success: true,
    data: campuses,
  });
});

const listHostels = asyncHandler(async (req, res) => {
  const hostels = await hostelService.listHostels();

  res.status(200).json({
    success: true,
    data: hostels,
  });
});

const getHostelById = asyncHandler(async (req, res) => {
  const hostel = await hostelService.getHostelById(req.params.hostelId);

  res.status(200).json({
    success: true,
    data: hostel,
  });
});

const createHostel = asyncHandler(async (req, res) => {
  const hostel = await hostelService.createHostel(req.body);

  res.status(201).json({
    success: true,
    message: "Hostel created successfully",
    data: hostel,
  });
});

const createBlock = asyncHandler(async (req, res) => {
  const block = await hostelService.createBlock(req.params.hostelId, req.body);

  res.status(201).json({
    success: true,
    message: "Block created successfully",
    data: block,
  });
});

const createFloor = asyncHandler(async (req, res) => {
  const floor = await hostelService.createFloor(req.params.blockId, req.body);

  res.status(201).json({
    success: true,
    message: "Floor created successfully",
    data: floor,
  });
});

const createRoom = asyncHandler(async (req, res) => {
  const room = await hostelService.createRoom(req.params.floorId, req.body);

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    data: room,
  });
});

const createBed = asyncHandler(async (req, res) => {
  const bed = await hostelService.createBed(req.params.roomId, req.body);

  res.status(201).json({
    success: true,
    message: "Bed created successfully",
    data: bed,
  });
});

const createRoomWithBeds = asyncHandler(async (req, res) => {
  const room = await hostelService.createRoomWithBeds(req.params.floorId, req.body);

  res.status(201).json({
    success: true,
    message: "Room with beds created successfully",
    data: room,
  });
});

const updateBedStatus = asyncHandler(async (req, res) => {
  const bed = await hostelService.updateBedStatus(req.params.bedId, req.body);

  res.status(200).json({
    success: true,
    message: "Bed status updated successfully",
    data: bed,
  });
});

module.exports = {
  listCampuses,
  listHostels,
  getHostelById,
  createHostel,
  createBlock,
  createFloor,
  createRoom,
  createBed,
  createRoomWithBeds,
  updateBedStatus,
};

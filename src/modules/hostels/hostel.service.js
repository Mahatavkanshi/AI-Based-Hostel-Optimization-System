const prisma = require("../../lib/prisma");
const ApiError = require("../../utils/api-error");

const campusSelect = {
  id: true,
  name: true,
  code: true,
  address: true,
};

const hostelTreeInclude = {
  campus: {
    select: campusSelect,
  },
  blocks: {
    orderBy: { code: "asc" },
    include: {
      floors: {
        orderBy: { floorNo: "asc" },
        include: {
          rooms: {
            orderBy: { roomNumber: "asc" },
            include: {
              beds: {
                orderBy: { bedNumber: "asc" },
              },
            },
          },
        },
      },
    },
  },
};

const ensureCampusExists = async (campusId) => {
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });

  if (!campus) {
    throw new ApiError(400, "Campus not found");
  }

  return campus;
};

const ensureHostelExists = async (hostelId) => {
  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  return hostel;
};

const ensureBlockExists = async (blockId) => {
  const block = await prisma.block.findUnique({ where: { id: blockId } });

  if (!block) {
    throw new ApiError(404, "Block not found");
  }

  return block;
};

const ensureFloorExists = async (floorId) => {
  const floor = await prisma.floor.findUnique({ where: { id: floorId } });

  if (!floor) {
    throw new ApiError(404, "Floor not found");
  }

  return floor;
};

const ensureRoomExists = async (roomId) => {
  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  return room;
};

const listCampuses = async () =>
  prisma.campus.findMany({
    select: campusSelect,
    orderBy: { name: "asc" },
  });

const listHostels = async () =>
  prisma.hostel.findMany({
    include: hostelTreeInclude,
    orderBy: { name: "asc" },
  });

const getHostelById = async (hostelId) => {
  const hostel = await prisma.hostel.findUnique({
    where: { id: hostelId },
    include: hostelTreeInclude,
  });

  if (!hostel) {
    throw new ApiError(404, "Hostel not found");
  }

  return hostel;
};

const createHostel = async (payload) => {
  const { campusId, name, code, type, capacity, address } = payload;

  if (!campusId || !name || !code || !type || !capacity) {
    throw new ApiError(400, "campusId, name, code, type, and capacity are required");
  }

  await ensureCampusExists(campusId);

  return prisma.hostel.create({
    data: {
      campusId,
      name,
      code: String(code).toUpperCase(),
      type,
      capacity: Number(capacity),
      address: address || null,
    },
    include: {
      campus: {
        select: campusSelect,
      },
    },
  });
};

const createBlock = async (hostelId, payload) => {
  const { name, code } = payload;

  if (!name || !code) {
    throw new ApiError(400, "name and code are required for block creation");
  }

  await ensureHostelExists(hostelId);

  return prisma.block.create({
    data: {
      hostelId,
      name,
      code: String(code).toUpperCase(),
    },
  });
};

const createFloor = async (blockId, payload) => {
  const { floorNo } = payload;

  if (floorNo === undefined || floorNo === null) {
    throw new ApiError(400, "floorNo is required");
  }

  await ensureBlockExists(blockId);

  return prisma.floor.create({
    data: {
      blockId,
      floorNo: Number(floorNo),
    },
  });
};

const createRoom = async (floorId, payload) => {
  const { roomNumber, roomType, capacity } = payload;

  if (!roomNumber || !roomType || !capacity) {
    throw new ApiError(400, "roomNumber, roomType, and capacity are required");
  }

  await ensureFloorExists(floorId);

  return prisma.room.create({
    data: {
      floorId,
      roomNumber: String(roomNumber).toUpperCase(),
      roomType,
      capacity: Number(capacity),
    },
    include: {
      beds: {
        orderBy: { bedNumber: "asc" },
      },
    },
  });
};

const createBed = async (roomId, payload) => {
  const { bedNumber, status } = payload;

  if (!bedNumber) {
    throw new ApiError(400, "bedNumber is required");
  }

  await ensureRoomExists(roomId);

  return prisma.bed.create({
    data: {
      roomId,
      bedNumber: String(bedNumber).toUpperCase(),
      status: status || "AVAILABLE",
    },
  });
};

const createRoomWithBeds = async (floorId, payload) => {
  const { roomNumber, roomType, capacity, bedNumbers } = payload;

  if (!Array.isArray(bedNumbers) || bedNumbers.length === 0) {
    throw new ApiError(400, "bedNumbers must be a non-empty array");
  }

  await ensureFloorExists(floorId);

  const uniqueBedNumbers = [...new Set(bedNumbers.map((value) => String(value).toUpperCase()))];

  if (capacity && uniqueBedNumbers.length !== Number(capacity)) {
    throw new ApiError(400, "capacity must match the number of bedNumbers provided");
  }

  return prisma.room.create({
    data: {
      floorId,
      roomNumber: String(roomNumber).toUpperCase(),
      roomType,
      capacity: capacity ? Number(capacity) : uniqueBedNumbers.length,
      beds: {
        create: uniqueBedNumbers.map((bedNumber) => ({
          bedNumber,
        })),
      },
    },
    include: {
      beds: {
        orderBy: { bedNumber: "asc" },
      },
    },
  });
};

const updateBedStatus = async (bedId, payload) => {
  const { status } = payload;

  if (!status) {
    throw new ApiError(400, "status is required");
  }

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: {
      allocations: {
        where: { status: "ACTIVE" },
      },
    },
  });

  if (!bed) {
    throw new ApiError(404, "Bed not found");
  }

  if (bed.allocations.length > 0 && status !== "OCCUPIED") {
    throw new ApiError(400, "Active allocation exists for this bed; keep status as OCCUPIED until deallocation");
  }

  return prisma.bed.update({
    where: { id: bedId },
    data: { status },
  });
};

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

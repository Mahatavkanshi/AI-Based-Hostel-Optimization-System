const express = require("express");
const auth = require("../../middlewares/auth");
const requireRole = require("../../middlewares/require-role");
const hostelController = require("./hostel.controller");

const router = express.Router();

router.use(auth, requireRole("ADMIN"));

router.get("/campuses", hostelController.listCampuses);
router.get("/", hostelController.listHostels);
router.get("/:hostelId", hostelController.getHostelById);
router.post("/", hostelController.createHostel);
router.post("/:hostelId/blocks", hostelController.createBlock);
router.post("/blocks/:blockId/floors", hostelController.createFloor);
router.post("/floors/:floorId/rooms", hostelController.createRoom);
router.post("/floors/:floorId/rooms-with-beds", hostelController.createRoomWithBeds);
router.post("/rooms/:roomId/beds", hostelController.createBed);
router.patch("/beds/:bedId/status", hostelController.updateBedStatus);

module.exports = router;

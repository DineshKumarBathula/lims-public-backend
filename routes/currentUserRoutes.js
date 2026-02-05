const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  getMyTickets,
  getOrderDetails,
  getMytests,
  getMyLeavesStatus,
  applyLeave,
  getMyLeaves,
  getMyJobsStats,
  updateMyPassword,
} = require("../controllers/currentUserControllers");
const { validateToken } = require("../defs/customFunctions");

router.get("/get-my-profile", validateToken, getMyProfile);
router.get("/get-my-tickets", validateToken, getMyTickets);
router.get("/get-my-leaves", validateToken, getMyLeaves);
router.get("/get-my-leaves2", validateToken, getMyJobsStats);
router.get("/get-my-tests", validateToken, getMytests);
router.get("/get-my-leaves-status", validateToken, getMyLeavesStatus);
router.post("/submit-leave-form", validateToken, applyLeave);
router.post("/update-password", validateToken, updateMyPassword);

module.exports = router;

const express = require("express");
const router = express.Router();

const { validateToken } = require("../defs/customFunctions");

const {
  getHodDashboard,
  getHodTests,
} = require("../controllers/hodController");

// HOD Dashboardrouter.get("/dashboard", verifyToken, getHodDashboard);
router.get("/dashboard", validateToken, getHodDashboard);
// HOD Tests list
router.get("/tests", validateToken, getHodTests);

module.exports = router;

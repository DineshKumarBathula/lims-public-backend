const express = require("express");
const router = express.Router();
// const analystController = require("../controllers/analystController");
const { validateToken } = require("../defs/customFunctions");
const { getTotalTests, getTestsDailyTrend,getTestsByMaterial } = require("../controllers/analystController");
// Material-wise tests
router.get("/tests/material", getTestsByMaterial);

// Daily trend of tests
router.get("/tests/daily-trend", getTestsDailyTrend);

// Total tests + breakdown
router.get("/tests/total", validateToken, getTotalTests);

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { memoryStorage } = require("multer");
require("dotenv").config();

const {
  getTop10AccountsOrdered,
  getDailyCounts,
  getMonthlyCounts,
} = require("../controllers/adminControllers");

const storage = memoryStorage();
const upload = multer({ storage });

router.get("/top-10-accounts-ordered", getTop10AccountsOrdered);
router.get("/daily-counts-of-all-entities", getDailyCounts);
router.get("/monthly-counts-of-all-entities", getMonthlyCounts);

module.exports = router;

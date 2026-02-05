const express = require("express");
const router = express.Router();

const {
  getMoreOrdersPlacedCustomersStats,
  getCostlyCustomers,
  getAllmonthsReport,
} = require("../controllers/statsControllers");

router.get(
  "/get-more-orders-placed-customers",
  getMoreOrdersPlacedCustomersStats,
);

router.get("/get-costly-customers", getCostlyCustomers);
router.get("/get-all-months-report", getAllmonthsReport);

module.exports = router;

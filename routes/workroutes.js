const express = require("express");
const multer = require("multer");
const upload = multer();
const {
  createWorkOrder,
  getAllWorkOrders,
} = require("../controllers/WorkOrderController");

const router = express.Router();

router.post("/", createWorkOrder);
router.get("/", getAllWorkOrders);

module.exports = router;

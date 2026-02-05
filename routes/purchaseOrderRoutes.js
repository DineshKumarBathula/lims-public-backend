// routes/purchaseOrderRoutes.js
const express = require("express");
const multer = require("multer");
const upload = multer(); // parses multipart/form-data into req.body + req.file

const {
  createPurchaseOrder,
  getAllPurchaseOrders,
  deletePurchaseOrder,
} = require("../controllers/purchaseOrderController");

const router = express.Router();

// use "order_file" since that's the key in your frontend FormData.append("order_file", orderFile)
router.post("/", upload.array("quotation_files", 10), createPurchaseOrder);
router.post(
  "/purchase-orders",
  upload.array("quotation_files", 10),
  createPurchaseOrder
);

router.get("/", getAllPurchaseOrders);
router.delete("/:id", deletePurchaseOrder);

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { memoryStorage } = require("multer");
const storage = memoryStorage();
const upload = multer({ storage });

const {
  addPoDocument,
  getPoDocuments,
} = require("../controllers/poDocumentController");

// ADD (PI / TI / ACK)
router.post(
  "/purchase-orders/:po_id/documents",
  upload.array("files", 5), // ⬅️ MULTER HERE
  addPoDocument
);

// VIEW (PI / TI / ACK)
router.get("/purchase-orders/:po_id/documents/:type", getPoDocuments);

module.exports = router;

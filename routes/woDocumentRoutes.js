const express = require("express");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  addWoDocument,
  getWoDocuments,
} = require("../controllers/woDocumentController");

const router = express.Router();

router.post(
  "/work-orders/:wo_id/documents",
  upload.array("files", 100),
  addWoDocument,
);

router.get("/work-orders/:wo_id/documents/:type", getWoDocuments);

module.exports = router;

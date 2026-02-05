const express = require("express");
const router = express.Router();
const {
  materialTestingQuotation,
  deleteQuotation,
  getNDTquotationsController,
} = require("../reports/materialTestingQuotation");
const { createNdtQuotation } = require("../reports/ndtQuotationController");
const {
  createGtQuotation,
  getGTquotationsController,
  updateGtQuotation,
  deleteGtQuotation,
} = require("../controllers/gtQuotationController");
// const { createGtQuotation } = require("./bdRoutes");
router.post("/material-testing-quotation", materialTestingQuotation);
router.post("/submit-ndt-quotation", createNdtQuotation);
router.post("/submit-gt-quotation", createGtQuotation);
router.get("/get-gt-quotations", getGTquotationsController);
// router.post("/submit-gt-quotation", createGtQuotation);
// router.get("/get-gt-quotations", getGTquotationsController);
router.put("/update-gt-quotation", updateGtQuotation);
router.delete("/delete-gt-quotation", deleteGtQuotation);

router.delete("/delete-quotation", deleteQuotation);
router.get("/get-ndt-quotations", getNDTquotationsController);

module.exports = router;

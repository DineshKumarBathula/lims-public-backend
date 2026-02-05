const express = require("express");
const router = express.Router();

const {
  getAllCustomers,
  addCustomer,
  getCustomerInfoById,
  getCustomerPartialInfo,
  updateCustomerById,
  getIthCustomerReport,
  getVendorLedger,
  addClient,
  addVendor,
  getClientsByCustomerId,
  getAllVendors,
  updateVendorById,
} = require("../controllers/customersControllers");

router.post("/reg-customer", addCustomer);
router.post("/reg-vendor", addVendor);

router.post("/reg-client", addClient);

router.get("/get-customer-list", getAllCustomers);
router.get("/get-vendor-list", getAllVendors);

router.get("/get-customer-info-gst-info/:customer_id", getCustomerInfoById);
router.get("/get-customers-partial-info", getCustomerPartialInfo);
router.post("/update-customer/:customer_id", updateCustomerById);
router.post("/update-vendor/:vendor_id", updateVendorById);

router.get("/get-vendor-ledger/:vendor_id", getVendorLedger);

router.get("/ith-customer-report/:customer_id", getIthCustomerReport);
router.get("/get-client", getClientsByCustomerId);

module.exports = router;

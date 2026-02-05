const express = require("express");
const router = express.Router();
const multer = require("multer");
const { memoryStorage } = require("multer");
const storage = memoryStorage();
const upload = multer({ storage });

const {
  offlineOrderRegistration,
  offlineOrderRegistrationWithRor,
  repeatSampleOrder,
  getOrderUpdateFormData,
  getOrderDraftUpdateFormData,
  getCompleteOrderDetails,
  getProformaInvoicesDaily,
  getOrdersRevenueDashboard,
  getTaxInvoicesDaily,
  getCustomersRevenueDashboard,
  getNewCustomers,
  getMonthlyMaterials,
  getMonthlyOutstanding,
  getMonthlyReceived,
  getMaterialQuotationsDashboard,
  getNdtQuotationsDashboard,
  getGtQuotationsDashboard,
  updateOfflineOrder,
  getAllOrders,
  getIntegratedOrderData,
  saveDraftOrder,
  getAllReqs,

  getAllOrdersHighNums,
  updateOfflineOrderWithRor,
  getAllOrdersRevenue,
} = require("../controllers/orderControllers");
const { validateToken } = require("../defs/customFunctions");

// router.post(
//   "/register-offline-order",
//   upload.single("letter"),
//   validateToken,
//   offlineOrderRegistration
// );

router.post(
  "/register-ror-order",
  upload.single("letter"),
  // validateToken,
  offlineOrderRegistrationWithRor,
);
// router.post("/repeat-sample", repeatSampleOrder);

router.put(
  "/update-ror-order/:orderId",
  upload.single("letter"),
  validateToken,
  updateOfflineOrder,
);

router.post(
  "/register-ror",
  // upload.single("letter"),
  validateToken,
  saveDraftOrder,
);

router.get("/get-complete-order-info/:id", getCompleteOrderDetails); //order info component
router.get("/order-update-form-data/:order_id", getOrderUpdateFormData); //order update form - prefill form
router.get(
  "/order-draft-update-form-data/:order_number",
  getOrderDraftUpdateFormData,
);
// router.post(
//   "/update-offline-order/:orderId",
//   upload.single("letter"),
//   updateOfflineOrder
// );

router.get("/get-all-orders", getAllOrders);
router.get("/get-integrated-orders", validateToken, getIntegratedOrderData);

router.get("/get-all-orders-revenue", getAllOrdersRevenue);

router.get("/get-all-orders-high-numbers", getAllOrdersHighNums);

router.get("/get-proforma-data", getProformaInvoicesDaily);
router.get("/get-taxinvoice-data", getTaxInvoicesDaily);
router.get("/get-tets-rev", getOrdersRevenueDashboard);
router.get("/get-all-requests", getAllReqs);
// router.post("/bd/check-ulr", checkULRExists); getNewCustomers

router.get("/get-customers-revenue", getCustomersRevenueDashboard);
router.get("/get-new-customers", getNewCustomers);
router.get("/get-monthly-materials", getMonthlyMaterials);
router.get("/get-monthly-outstanding", getMonthlyOutstanding);
router.get("/get-monthly-received", getMonthlyReceived);

router.get("/get-quatations/lab", getMaterialQuotationsDashboard);
router.get("/quotations/gt", getGtQuotationsDashboard);

// NDT
router.get("/quotations/ndt", getNdtQuotationsDashboard);

module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { memoryStorage } = require("multer");
require("dotenv").config();

const {
  createCallbackRequest,
  getAllParams,
  subscribeController,
  onAddingNewProduct,
  getAllProductsNameId,
  addParams,
  getRequestCallbacks,
  uploadCustomerRequestAudio,

  getCustomersList,
  getSubscribers,

  //website
  getSiteUsers,

  // Graphs
  getSubscriberStatisticsMonthly,
  getSubscriberStatisticsLast30Days,
  getCustomerStatisticsMonthly,
  getLast30CustomerCounts,
  getOrderStatisticsMonthly,
  getLast30DaysOrderCounts,
  getProductSampleCounts,
  getDisciplineWise,
  getOnlineUsersMonthly,
  getOnlineUsersDaily,
  quotationsMonthlyRecors,
  getAllQuotations,
  getQuotationsDaily,
  cancelOrder,
  // proformaToTaxConversion,
  getAllSamples,

  getScope,
  // offlineOrderUpdation,
  createDuplicateJobById,
  //samples
  getUnregistedSamples,
  onRegisteringSample,
  getProductsTheirParams,
  getOrderBasicInfoByOrderId,
  getCustomerInfoOfIthOrder,
  getAllJobsOfIthOrder,
  // mergeAndCreateTaxInvoice,
  mergeAndCreateManulTaxInvoice,
  onRequestingFeedback,
  onSubmittingFeedback,
  getFeedbackStatus,
  getAllFeedbackDashboard,
  getFeedbackRequestStatus,
  getOrderSticker,
  onRegisteringSample2ndApi,
  deleteParamById,
  deleteJobById,
  getReportFinalscreen,
  getFinalReport,
  getQuotationByIdService,
} = require("../controllers/bdControllers");
const { checkDuplicateOrderPn } = require("../controllers/bdControllers");

const { validateToken } = require("../defs/customFunctions");

const storage = memoryStorage();
const upload = multer({ storage });

router.delete("/delete-param", deleteParamById);
router.delete("/delete-job", deleteJobById);
router.post("/create-duplicate-job", createDuplicateJobById);

router.get("/name-id", getAllProductsNameId);
router.get("/get-qtn-by-id", getQuotationByIdService);
router.post("/on-request-callback", createCallbackRequest);
router.post("/subscribe", subscribeController);
router.post(
  "/adding-new-product",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image_lg", maxCount: 1 },
  ]),
  onAddingNewProduct,
);

// router.get("/order/:order_id", getCompleteOrderDetails);
router.post("/add-param", addParams);
router.get("/get-request-callbacks", getRequestCallbacks);
router.post(
  "/upload-customer-request-audio",
  upload.single("audio"),
  uploadCustomerRequestAudio,
);

//have to delete this from here

router.get("/get-customers-list", getCustomersList);
router.get("/get-online-users", getSiteUsers);

router.get("/get-subscribers-list", getSubscribers);
router.get("/get-subscribers-graph", getSubscriberStatisticsMonthly);
router.get(
  "/get-subscribers-graph-last30days",
  getSubscriberStatisticsLast30Days,
);

router.get("/get-customers-graph", getCustomerStatisticsMonthly);
router.get("/get-customers-graph-last30days", getLast30CustomerCounts);
router.get("/orders-monthly-record", getOrderStatisticsMonthly);
router.get("/order-daily-record", getLast30DaysOrderCounts);
router.get("/samples-statistics", getProductSampleCounts);
router.get("/discipline-wise", getDisciplineWise);
router.get("/get-online-users-daily", getOnlineUsersDaily);
router.get("/get-online-users-monthly", getOnlineUsersMonthly);
router.get("/get-all-params", getAllParams);
// router.post(
//   "/register-offline-order",
//   upload.single("letter"),
//   offlineOrderRegistration
// );

// router.post(
//   "/update-offline-order/:orderId",
//   upload.single("letter"),
//   offlineOrderUpdation
// );

router.get("/get-scope", getScope);
// quotations

router.get("/get-quotations", getAllQuotations);
router.get("/get-quotations-daily", getQuotationsDaily);
router.get("/get-quotations-monthly", quotationsMonthlyRecors);
router.get("/check-duplicate-order", checkDuplicateOrderPn);

//tax conversion
// router.post("/request-convert-to-tax", validateToken, proformaToTaxConversion);

//view samples
router.get("/get-all-samples", getAllSamples);

//to get all the samples
router.get("/get-unregistered-samples", getUnregistedSamples);
router.post("/on-register-sample", validateToken, onRegisteringSample);
router.post(
  "/on-register-sample-2nd-api",
  validateToken,
  onRegisteringSample2ndApi,
);

router.get("/get-products-their-params", validateToken, getProductsTheirParams);
router.get(
  "/get-order-basic-details-by-id",
  validateToken,
  getOrderBasicInfoByOrderId,
);

router.get(
  "/get-customer-details-of-ith-order",
  validateToken,
  getCustomerInfoOfIthOrder,
);

router.get("/get-all-jobs-of-ith-order", validateToken, getAllJobsOfIthOrder);
// router.post(
//   "/merge-and-convert-tax-invoice",
//   validateToken,
//   mergeAndCreateTaxInvoice
// );
router.post(
  "/merge-and-convert-tax-invoice",
  validateToken,
  mergeAndCreateManulTaxInvoice,
);

router.post("/request-feedback", validateToken, onRequestingFeedback);
router.get("/feedback-status", validateToken, getFeedbackRequestStatus);

router.post("/submit-feedback", onSubmittingFeedback);
router.get("/feedback-dashboard", getAllFeedbackDashboard);

router.get("/status/:fId", getFeedbackStatus);

router.put("/cancel-order", validateToken, cancelOrder);

router.get("/get-order-sticker-doc", validateToken, getOrderSticker);

router.get(
  "/get-report-final-screen-info",
  validateToken,
  getReportFinalscreen,
);

router.post("/get-final-report", validateToken, getFinalReport);

module.exports = router;

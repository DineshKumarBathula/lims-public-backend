const express = require("express");
const router = express.Router();
const multer = require("multer");
const { memoryStorage } = require("multer");

const {
  // getPendingAssigningOrders,
  getAllAnalyst,
  getAllMyJobs,
  assignSamplesToAnalyst,
  getRegisterdButPendingAssignedSamples,
  assignJobToAnalyst,
  getSamplesInProgress,
  repeatSampleJobs,
  getJobParamsDetails,
  repeatJob,
  submitJob,
  getJobResultCompare,
  dispatchJob,
  getAllReadyToDispatchReports,
  checkULRExists,
  submitEquip,
  getAllEquip,
  getEquipProfile,
  requestToRetakeTest,
  resetJob,
  repeatFullOrder,
  getMyReport,
  getMyRORReport,
  updateJobColumn,
  repeatSampleToNewOrder,
  updateReportApproval,

  mergeReports,
  updateEquip,
} = require("../controllers/labControllers");
const { validateToken } = require("../defs/customFunctions");
require("dotenv").config();

const storage = memoryStorage();
const upload = multer({ storage });

router.get(
  "/get-pending-Assigned-samples",
  getRegisterdButPendingAssignedSamples,
);
router.post("/repeat-order", validateToken, repeatFullOrder);
router.post(
  "/repeat-sample-to-new-order",
  validateToken,
  repeatSampleToNewOrder,
);

router.get("/get-all-analysts", getAllAnalyst);
router.post("/assign-samples-to-analyst", assignSamplesToAnalyst);
router.get("/get-my-jobs", validateToken, getAllMyJobs);
router.post("/assign-job-to-analyst", validateToken, assignJobToAnalyst);
router.get("/get-inprogress-samples-list", getSamplesInProgress);
// router.get("/get-inprogress-samples-list", getJobParamsDetails);
router.post("/repeat-job", validateToken, repeatJob);
router.post("/repeat-sample-jobs", validateToken, repeatSampleJobs);

router.get("/get-job-param-details", validateToken, getJobParamsDetails);
router.post("/submit-job", submitJob);
// router.post("/submit-job", validateToken, submitJob);
router.get("/job-result-compare/:job_pk", getJobResultCompare);

router.post("/dispatch-this-job", validateToken, dispatchJob);
router.get(
  "/get-all-ready-to-delivery-reports",
  validateToken,
  getAllReadyToDispatchReports,
);
router.post("/check-ulr", checkULRExists);

router.post(
  "/submit-equip",
  upload.fields([
    { name: "equip_img", maxCount: 1 },
    { name: "consumable_img", maxCount: 1 },
    { name: "furniture_img", maxCount: 1 },
    { name: "hardware_img", maxCount: 1 },

    // ⭐ New certificate fields for Fixed Assets
    { name: "calib_c1", maxCount: 1 },
    { name: "calib_c2", maxCount: 1 },
    { name: "calib_c3", maxCount: 1 },
  ]),
  submitEquip,
);

router.post(
  "/update-equip/:equip_id",
  upload.fields([
    { name: "equip_img", maxCount: 1 },
    { name: "consumable_img", maxCount: 1 },
    { name: "furniture_img", maxCount: 1 },
    { name: "hardware_img", maxCount: 1 },
    { name: "calib_c1", maxCount: 1 },
    { name: "calib_c2", maxCount: 1 },
    { name: "calib_c3", maxCount: 1 },
  ]),
  updateEquip,
);

// router.post("/update-equip/:equip_id", upload.single("equip_img"), updateEquip);

router.get("/get-equip", getAllEquip);
router.get("/get-equip-byId", validateToken, getEquipProfile);
router.post("/report-check", getMyReport);
// router.post("/report-check", validateToken, getMyReport);

router.post("/ror-check", getMyRORReport);
router.post("/merge-reports", validateToken, mergeReports);

router.post("/request-to-retake", validateToken, requestToRetakeTest);
router.post("/reset-test-from", validateToken, resetJob);
// router.put("/update-job-column", validateToken, updateJobColumn);
router.put("/update-job-column", validateToken, updateReportApproval);

module.exports = router;

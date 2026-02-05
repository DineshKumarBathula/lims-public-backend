const express = require("express");

const multer = require("multer");
const { memoryStorage } = require("multer");
const storage = memoryStorage();
const upload = multer({ storage });

const {
  getAllBranches,
  getAllDepartments,
  getAllRoles,
  getAllAccessKeys,
  addEmployee,
  getAllEmployees,
  getAnalystProfile,
  fetchLeavesHistory,
  fetchEmployeeDetailsById,
  getMyTeamByID,
} = require("../controllers/hrControllers");
const { validateToken } = require("../defs/customFunctions");

const router = express.Router();

router.get("/get-roles", getAllRoles);
router.get("/get-employees", getAllEmployees);
router.get("/get-branch", getAllBranches);
router.get("/get-departments", getAllDepartments);
router.get("/get-accesskeys", getAllAccessKeys);
// router.post("/register-employee", addEmployee);
router.get("/get-analyst-profile/:empId", getAnalystProfile);
router.post(
  "/submit-add-emp-form",
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "signature", maxCount: 1 },
  ]),
  addEmployee
);

router.get("/fetch-leaves-history", validateToken, fetchLeavesHistory);
router.get("/fetch-emp-profile-by-id", validateToken, fetchEmployeeDetailsById);
// router.get("/fetch-emp-team-by-emp-id", validateToken, getMyTeamByID);

module.exports = router;

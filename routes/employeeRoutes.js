const express = require("express");

const {
  loginEmployee,getMyNotifications,
  loginLIMS,
} = require("../controllers/employeeControllers");

const router = express.Router();

// router.post("/req-login-app", loginEmployee);
router.post("/req-login-app", loginLIMS);
router.get("/get-my-notifications", getMyNotifications);


module.exports = router;

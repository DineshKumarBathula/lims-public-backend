const express = require("express");

const { loginUser } = require("../controllers/ecommerceControlers");

const router = express.Router();

router.post("/user/login", loginUser);

module.exports = router;

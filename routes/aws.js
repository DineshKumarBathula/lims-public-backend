const express = require("express");
const router = express.Router();
require("dotenv").config();

const AWS = require("aws-sdk");
const { getSignedURLofWorkOrder } = require("../controllers/awsControllers");
const s3 = new AWS.S3();

router.get("/get-work-letter", getSignedURLofWorkOrder);

module.exports = router;

const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const router = express.Router();
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
const s3 = new AWS.S3();

const uploadFileToS3 = async (file) => {
  try {
    const uploadParams = {
      Bucket: process.env.AWS_MATERIALS_BUCKET,
      Key: file.originalname,
      Body: file.buffer,
    };
    await s3.upload(uploadParams).promise();
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};

router.post(
  "/add-new-material",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image_lg", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log(req.body);
    try {
      const {
        name,
        category,
        rating,
        base_price,
        isOffer,
        offer,
        prefix,
        complete_pack,
        description,
        no_of_days,
        interim_report,
        interim_report_days,
        features,
      } = req.body;

      // Function to upload a file to S3

      // Upload "image" file to S3 if provided
      if (req.files["image"]) {
        await uploadFileToS3(req.files["image"][0]);
      }

      // Upload "image_lg" file to S3 if provided
      if (req.files["image_lg"]) {
        await uploadFileToS3(req.files["image_lg"][0]);
      }

      // Create a new product entry in the database
      const newProduct = await db.Product.create({
        name,
        category,
        rating,
        base_price,
        isOffer,
        offer,
        prefix,
        complete_pack,
        description,
        no_of_days,
        interim_report,
        interim_report_days,
        features: features ? JSON.stringify(features) : null,
        image: req.files["image"] ? req.files["image"][0].location : null,
        image_lg: req.files["image_lg"]
          ? req.files["image_lg"][0].location
          : null,
      });

      // Respond with the newly created product
      res.json(newProduct);
    } catch (error) {
      console.error("Error uploading product:", error);
      res.status(500).send("Internal server error");
    }
  },
);

router.get("", (req, res) => {
  return res.json({
    message:
      "hello it is healthy after injecting env variables checking process.env hello world",
    env: process.env,
  });
});

module.exports = router;

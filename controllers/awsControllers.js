require("dotenv").config();

const AWS = require("aws-sdk");
const s3 = new AWS.S3();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const getSignedUrlOfObject = async (fileName, bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60 * 5,
  };
  try {
    const url = await s3.getSignedUrlPromise("getObject", params);
    return url;
  } catch (err) {
    console.error("Error generating signed URL", err);
    throw err;
  }
};

const getSignedURLofWorkOrder = async (req, res) => {
  try {
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();

    const { data } = req.query;

    const url = await getSignedUrlOfObject(
      data,
      process.env.AWS_KDM_WORK_ORDER_LETTERS,
    );

    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();
    console.log();

    console.log(url);

    return res.status(200).json({ message: url });
  } catch (err) {
    console.log("Failed to get the signed URL of work-order");
    return res.status(500).json({ message: "Failed to get the signed URL" });
  }
};

const deleteObjFromBkt = async (bname, key) => {
  try {
    await s3
      .deleteObject({
        Bucket: bname,
        Key: key,
      })
      .promise();
  } catch (err) {
    throw err;
  }
};

module.exports = { getSignedURLofWorkOrder, deleteObjFromBkt };

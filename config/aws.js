require("dotenv").config();

const { putObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");

const s3 = new S3Client();
const BUCKET = process.env.AWS_MATERIALS_BUCKET;

const uploadToS3 = async ({ file }) => {
  const key = `${uuidv4()}-${file.originalname}`;
  const command = new putObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(command);
    return { key };
  } catch (error) {
    return { error };
  }
};

// require("dotenv").config();
// const multer = require("multer");
// const { v4: uuidv4 } = require("uuid");

// import {putObjectCommand} from '@aws-sdk/client-s3'

// const uploadToS3 = async (file, userId) => {
//   const key = `${uuidv4()}-${file.originalname}`;
//   const command = new
// };

// const AWS = require("aws-sdk");
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

// const upload = multer({
//   storage: multerS3({
//     s3,
//     bucket: process.env.AWS_MATERIALS_BUCKET,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     acl: "public-read",
//     key: (req, file, cb) => {
//       cb(null, `${uuidv4()}-${file.originalname}`);
//     },
//   }),
// });

// module.exports = { s3, upload };

module.exports = uploadToS3;

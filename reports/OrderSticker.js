const PdfPrinter = require("pdfmake");
const path = require("path");

const ORDER_SAMPLE_STICKERS =
  process.env.ORDER_SAMPLE_STICKERS || "tb-kdm-order-sample-sticker";

// AWS setup
const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

const getParams = (params) => {
  const res = [];
  const sdkfj = params
    .map((each) => JSON.parse(each.params_info || "[]"))
    .map((each) => {
      each.map((sdf) => res.push(sdf.testName));
    });

  return res.join(",\n");
};

const docDefinition = (orderInfo) => {
  return {
    pageMargins: [20, 70, 20, 70],

    content: [
      ...orderInfo.samples.map((sample, index) => ({
        table: {
          widths: ["30%", "70%"], // Adjusted for better spacing
          body: [
            [
              {
                text: `Sample ${index + 1}`,
                colSpan: 2,
                style: "tableHeader",
                fontSize: 12, // Customizable font size
              },
              {},
            ],
            [
              { text: "Sample Code", style: "tableCell" },
              { text: sample.sample_code, style: "tableCell" },
            ],

            [
              { text: "Sample Name", style: "tableCell" },
              { text: sample.product.name, style: "tableCell" },
            ],
            [
              { text: "Test Method", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],
            [
              { text: "Job Number", style: "tableCell" },
              { text: orderInfo.order_number, style: "tableCell" },
            ],
            [
              { text: "Source", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],
            [
              { text: "Quantity", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],

            [
              { text: "Grade", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],
            [
              { text: "Brand Name", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],
            [
              { text: "Reference Code", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],
            [
              { text: "Site Name", style: "tableCell" },
              { text: "", style: "tableCell" },
            ],
            [
              { text: "Params", style: "tableCell" },
              { text: getParams(sample.params), style: "tableCell" },
            ],
          ],
        },
        layout: {
          hLineWidth: function (i, node) {
            return i === 0 || i === node.table.body.length ? 1 : 0.5;
          },
          vLineWidth: function () {
            return 0.5;
          },
          hLineColor: function () {
            return "#aaaaaa";
          },
          vLineColor: function () {
            return "#aaaaaa";
          },
        },
        margin: [0, 10, 0, 10],
      })),
    ],

    styles: {
      tableHeader: {
        fontSize: 14,
        bold: true,
        fillColor: "#f2f2f2",
        color: "black",
        alignment: "center",
      },
      tableCell: {
        fontSize: 10, // Default font size for table cells
        color: "black",
      },
    },
  };
};

const getSamplesStickerDocument = (orderInfo) => {
  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition(orderInfo));

      // Create a writable stream buffer to capture PDF data
      const chunks = [];

      // Event listener for receiving PDF data chunks
      pdfDoc.on("data", (chunk) => chunks.push(chunk));

      // Event listener for PDF document completion
      pdfDoc.on("end", async () => {
        try {
          // Concatenate PDF data chunks into a single buffer
          const pdfBuffer = Buffer.concat(chunks);
          // Upload the PDF buffer to AWS S3
          // Resolve the promise with the location

          const uploadParams = {
            Bucket: ORDER_SAMPLE_STICKERS,
            Key: orderInfo.order_id,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          };

          const uploadResult = await s3.upload(uploadParams).promise();

          console.log("PDF successfully uploaded to: ", uploadResult.Location);
          resolve(uploadResult.Location);
        } catch (error) {
          console.error("Error handling PDF document completion : ", error);
          reject(error);
        }
      });

      // End the PDF document
      pdfDoc.end();
    } catch (error) {
      console.error("Error creating PDF:", error);
      reject(error);
    }
  });
};

module.exports = { getSamplesStickerDocument };

// const PdfPrinter = require("pdfmake");
// const path = require("path");
// const { createHeader } = require("./header");
// const createFooter = require("./footer");
// const createWaterMark = require("./waterMark.js");
// require("dotenv").config();

// const MATERIAL_TESTING_TAX_INVOICES = process.env.MATERIAL_TESTING_TAX_INVOICES;

// // AWS setup
// const AWS = require("aws-sdk");
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const s3 = new AWS.S3();

// const fonts = {
//   Roboto: {
//     normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
//     bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
//     italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
//     bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
//   },
// };
// const printer = new PdfPrinter(fonts);

// const docDefinition = (billData, previousTaxInvoice) => {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = now.getMonth() + 1;
//   const date = now.getDate();
//   return {
//     pageMargins: [40, 90, 40, 60],
//     header: createHeader,
//     footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
//     content: [
//       {
//         text: "TAX INVOICE",
//         alignment: "center",
//         fontSize: 15,
//         margin: [0, 0, 0, 10],
//         color: "red",
//       },

//       {
//         columns: [
//           {
//             ...billData.slice(0, 1)[0].columns[0],
//           },
//           {
//             ...billData.slice(0, 1)[0].columns[1],
//             table: {
//               ...billData.slice(0, 1)[0].columns[1].table,
//               body: [
//                 [
//                   { text: "Invoice Number:", fontSize: 10 },
//                   {
//                     text: `VIZ/TI/${year}/${previousTaxInvoice + 1}`,
//                     fontSize: 10,
//                   },
//                 ],
//                 [
//                   { text: "Invoice Date:", fontSize: 10 },
//                   { text: `${year}-${month}-${date}`, fontSize: 10 },
//                 ],
//                 ...billData.slice(0, 1)[0].columns[1].table.body.slice(2),
//               ],
//             },
//           },
//         ],
//       },

//       ...billData.slice(1),
//     ],

//     background: (currentPage, pageCount) =>
//       createWaterMark(currentPage, pageCount),
//     styles: {
//       title: {
//         fontSize: 24,
//         bold: true,
//       },
//       header: {
//         fontSize: 18,
//         bold: true,
//         margin: [0, 0, 0, 10],
//       },
//       tableHeader: {
//         fontSize: 10,
//         color: "black",
//         fillColor: "#CCCCCC",
//       },
//       defaultStyle: {
//         font: "Roboto",
//       },
//       listItem: {
//         fontSize: 8,
//       },
//     },
//   };
// };

// const generateTaxInvoice = (billData, pdfDetails, previousTaxInvoice) => {
//   const parsedBillData = JSON.parse(billData);
//   // console.log(parsedBillData, 'parsedBillDataparsedBillData')
//   return new Promise((resolve, reject) => {
//     try {
//       const { pdf_name } = pdfDetails;

//       const docDefinationData = docDefinition(
//         parsedBillData,
//         previousTaxInvoice,
//       );

//       const pdfDoc = printer.createPdfKitDocument(docDefinationData);

//       const chunks = [];

//       pdfDoc.on("data", (chunk) => chunks.push(chunk));

//       pdfDoc.on("end", async () => {
//         try {
//           const pdfBuffer = Buffer.concat(chunks);

//           const uploadParams = {
//             Bucket: MATERIAL_TESTING_TAX_INVOICES,
//             Key: pdf_name,
//             Body: pdfBuffer,
//             ContentType: "application/pdf",
//           };

//           await s3.upload(uploadParams).promise();

//           resolve(pdf_name);
//         } catch (error) {
//           console.error("Error handling PDF document completion:", error);
//           reject(error);
//         }
//       });

//       // End the PDF document
//       pdfDoc.end();
//     } catch (error) {
//       console.error("Error creating PDF:", error);
//       reject(error);
//     }
//   });
// };

// module.exports = generateTaxInvoice;

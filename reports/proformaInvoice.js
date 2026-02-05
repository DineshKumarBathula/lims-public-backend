const PdfPrinter = require("pdfmake");
const path = require("path");
const { createHeader } = require("./header");
const { createFooter } = require("./footer.js");
const createWaterMark = require("./waterMark.js");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const {
  amountInWords,
  calculateDiscountedPrice,
  calculateDiscountAmount,
} = require("../defs/customFunctions.js");
const { qrScanner, RKsign, sagarSign, vizagStamp } = require("./filePaths");

const MATERIAL_TESTING_PROFORMAS = process.env.MATERIAL_TESTING_PROFORMAS;

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

// 🔹 GT Proforma PDF Generator

const getVizFinancialYear = (dateInput = new Date()) => {
  const date = new Date(dateInput); // handles dor safely
  const year = date.getFullYear();
  const month = date.getMonth(); // Jan = 0, Apr = 3

  const startYear = month < 3 ? year - 1 : year;

  return String(startYear); // e.g. "2025"
};

const generateNdtProformaInvoice = (
  billData,
  pdfDetails,
  dor = new Date(),
  clientInformation = {},
  selectedGst,
) => {
  return new Promise((resolve, reject) => {
    try {
      const { ndtItems = [], orderDetails, customerDetails } = billData;
      const { pdf_name } = pdfDetails;
      const invoiceNumber = `Proforma-Invoice-${String(pdfDetails.pn).padStart(4, "0")}`;
      const uniquePrefix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const fileName = `${uniquePrefix}/${invoiceNumber}.pdf`;
      // const fileName = `${invoiceNumber}.pdf`;
      console.log(ndtItems, "ndtItems76");
      // Utility: Convert number to words (supports up to crores)
      function convertNumberToWords(amount) {
        const words = [
          "",
          "One",
          "Two",
          "Three",
          "Four",
          "Five",
          "Six",
          "Seven",
          "Eight",
          "Nine",
          "Ten",
          "Eleven",
          "Twelve",
          "Thirteen",
          "Fourteen",
          "Fifteen",
          "Sixteen",
          "Seventeen",
          "Eighteen",
          "Nineteen",
        ];
        const tens = [
          "",
          "",
          "Twenty",
          "Thirty",
          "Forty",
          "Fifty",
          "Sixty",
          "Seventy",
          "Eighty",
          "Ninety",
        ];

        function numToWords(num) {
          if (num < 20) return words[num];
          if (num < 100)
            return (
              tens[Math.floor(num / 10)] +
              (num % 10 !== 0 ? " " + words[num % 10] : "")
            );
          if (num < 1000)
            return (
              words[Math.floor(num / 100)] +
              " Hundred" +
              (num % 100 !== 0 ? " " + numToWords(num % 100) : "")
            );
          if (num < 100000)
            return (
              numToWords(Math.floor(num / 1000)) +
              " Thousand" +
              (num % 1000 !== 0 ? " " + numToWords(num % 1000) : "")
            );
          if (num < 10000000)
            return (
              numToWords(Math.floor(num / 100000)) +
              " Lakh" +
              (num % 100000 !== 0 ? " " + numToWords(num % 100000) : "")
            );
          return (
            numToWords(Math.floor(num / 10000000)) +
            " Crore" +
            (num % 10000000 !== 0 ? " " + numToWords(num % 10000000) : "")
          );
        }

        const amt = Math.round(amount);
        return numToWords(amt);
      }
      const transportation_fee = parseFloat(
        orderDetails?.transportation_fee || 0,
      );

      // ---------- Build NDT Table ----------
      function createNDTContent(ndtData) {
        let total = 0;
        const body = [
          [
            { text: "S.No", style: "tableHeader" },
            { text: "Description", style: "tableHeader" },
            { text: "Unit", style: "tableHeader" },
            { text: "Qty", style: "tableHeader" },
            { text: "Rate", style: "tableHeader" },
            { text: "Amount", style: "tableHeader" },
          ],
        ];

        ndtData.forEach((item, index) => {
          const qty = parseFloat(item.qty || 0);
          const price = parseFloat(item.price || 0);
          const amount = qty * price;
          total += amount;

          body.push([
            { text: index + 1, style: "tableCell", bold: true },
            { text: item.description || "", style: "tableCell" },
            { text: item.unit || "", style: "tableCell" },
            { text: qty.toString(), style: "tableCell" },
            { text: price.toFixed(2), style: "tableCell" },
            { text: amount.toFixed(2), style: "tableCell" },
          ]);
        });

        return { body, total };
      }

      // ---------- Build PDF Definition ----------
      function createNDTDocDefinition(ndtData) {
        const { body, total } = createNDTContent(ndtData);
        // const totalAmount = parseFloat(total) || 0;
        const itemsTotal = parseFloat(total) || 0;
        const subTotal = itemsTotal + transportation_fee;

        const gstNumber = customerDetails?.gst_number;
        const gstType = gstNumber?.startsWith("37") ? "CGST_SGST" : "IGST";

        const cgstAmount = gstType !== "IGST" ? subTotal * 0.09 : 0;
        const sgstAmount = gstType !== "IGST" ? subTotal * 0.09 : 0;
        const igstAmount = gstType === "IGST" ? subTotal * 0.18 : 0;

        const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount;

        const amountInWords = convertNumberToWords(grandTotal) + " Only";

        return {
          totalAgg: grandTotal,
          pageMargins: [40, 70, 40, 60],
          header: createHeader,
          footer: (currentPage, pageCount) =>
            createFooter(currentPage, pageCount),
          background: (currentPage, pageCount) =>
            createWaterMark(currentPage, pageCount),
          content: [
            {
              text: "PROFORMA INVOICE (NDT)",
              alignment: "center",
              fontSize: 15,
              margin: [0, 0, 0, 10],
              color: "red",
            },

            ...createInvoiceHeader(
              customerDetails,
              orderDetails,
              pdfDetails,
              dor,
              clientInformation,
              selectedGst,
            ),

            {
              style: "tableExample",
              table: {
                headerRows: 1,
                widths: ["auto", "*", "auto", "auto", "auto", "auto"],
                body,
              },
            },

            {
              layout: {
                hLineWidth: (i) => (i === 0 ? 0 : 1),
                vLineWidth: () => 1,
              },
              table: {
                widths: ["*", "auto"],
                body: [
                  ...(transportation_fee > 0
                    ? [
                        [
                          {
                            text: "Transportation Charges",
                            alignment: "right",
                            bold: true,
                            style: "tableCell",
                          },
                          {
                            text: transportation_fee.toFixed(2),
                            alignment: "right",
                            style: "tableCell",
                          },
                        ],
                      ]
                    : []),

                  [
                    {
                      text: "Sub Total",
                      alignment: "right",
                      bold: true,
                      style: "tableCell",
                    },
                    {
                      text: subTotal.toFixed(2),
                      alignment: "right",
                      style: "tableCell",
                    },
                  ],
                  ...(gstType === "IGST"
                    ? [
                        [
                          {
                            text: "IGST (18%)",
                            alignment: "right",
                            bold: true,
                            style: "tableCell",
                          },
                          {
                            text: igstAmount.toFixed(2),
                            alignment: "right",
                            style: "tableCell",
                          },
                        ],
                      ]
                    : [
                        [
                          {
                            text: "CGST (9%)",
                            alignment: "right",
                            bold: true,
                            style: "tableCell",
                          },
                          {
                            text: cgstAmount.toFixed(2),
                            alignment: "right",
                            style: "tableCell",
                          },
                        ],
                        [
                          {
                            text: "SGST (9%)",
                            alignment: "right",
                            bold: true,
                            style: "tableCell",
                          },
                          {
                            text: sgstAmount.toFixed(2),
                            alignment: "right",
                            style: "tableCell",
                          },
                        ],
                      ]),
                  [
                    {
                      text: "Grand Total",
                      alignment: "right",
                      bold: true,
                      style: "tableCell",
                    },
                    {
                      text: grandTotal.toFixed(2),
                      alignment: "right",
                      bold: true,
                      style: "tableCell",
                    },
                  ],
                  [
                    {
                      text: `Amount in Words: ${amountInWords}`,
                      colSpan: 2,
                      alignment: "left",
                      style: "tableCell",
                      italics: true,
                      fontSize: 10,
                    },
                    {}, // Empty cell for colSpan
                  ],
                ],
              },
            },

            {
              unbreakable: true,
              columns: [
                {
                  stack: [
                    {
                      text: "SCAN & PAY", // 👈 text above image
                      fontSize: 10,
                      alignment: "center",
                      margin: [0, -20, 0, 0],
                    },
                    {
                      image: qrScanner,
                      width: 70,
                      height: 70,
                      alignment: "left",
                      margin: [0, 2, 0, 15],
                    },
                  ],
                  width: "auto",
                },
                {
                  stack: [
                    {
                      text: "For KDM Engineers (India) Private Limited",
                      alignment: "right",
                      fontSize: 10,
                      margin: [0, -15, 0, 0],
                    },
                    (signStack = [
                      {
                        stack: [
                          {
                            image: RKsign,
                            width: 90,
                            height: 30,
                            alignment: "right",
                            margin: [0, 6, 0, 0],
                          },
                          {
                            image: vizagStamp,
                            width: 65,
                            height: 65,
                            alignment: "right",
                            margin: [0, -55, 0, 0], // ✅ moves stamp *over* the sign (merged look)
                          },
                        ],
                        alignment: "center",
                      },
                    ]),

                    // {
                    //   image: RKsign,
                    //   width: 90,
                    //   height: 30,
                    //   alignment: "right",
                    //   margin: [0, 6, 0, 0],
                    // },
                    // {
                    //   image: vizagStamp,
                    //   width: 65,
                    //   height: 65,
                    //   alignment: "center",
                    //   margin: [0, -55, 0, 0], // ✅ moves stamp *over* the sign (merged look)
                    // },

                    {
                      text: "Authorized By",
                      fontSize: 9,

                      alignment: "right",
                      margin: [0, -5, 0, 0],
                    },

                    {
                      text: "M.Ramakrishna",
                      fontSize: 9,

                      alignment: "right",
                      margin: [0, 0, 0, 0],
                    },
                  ],
                  width: "*",
                },
              ],
              margin: [0, 20, 0, 0],
            },

            {
              text: "Our Bank Details",
              alignment: "right",
              fontSize: 10,
              margin: [0, -10, 60, 8],
            },
            createPANAndBankDetailsTable(),
          ],
          styles: {
            tableHeader: { fontSize: 10, bold: true, fillColor: "#eeeeee" },
            tableCell: { fontSize: 9 },
          },
          defaultStyle: { font: "Roboto" },
        };
      }

      // ---------- Generate PDF ----------
      const docDef = createNDTDocDefinition(ndtItems);
      const pdfDoc = printer.createPdfKitDocument(docDef);
      const chunks = [];

      pdfDoc.on("data", (chunk) => chunks.push(chunk));
      pdfDoc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const uploadParams = {
            Bucket: MATERIAL_TESTING_PROFORMAS,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          };

          await s3.upload(uploadParams).promise();

          resolve({
            location: fileName,
            proformaContent: docDef.content.slice(1),
            totalAgg: docDef.totalAgg,
            buffer: pdfBuffer,
          });
        } catch (err) {
          reject(err);
        }
      });

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateGeotechProformaInvoice = (
  billData,
  pdfDetails,
  dor = new Date(),
  clientInformation = {},
  selectedGst,
) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        geotechnicalItems = [],
        orderDetails,
        customerDetails,
      } = billData;
      const transportation_fee = parseFloat(
        orderDetails?.transportation_fee || 0,
      );
      const { pdf_name } = pdfDetails;

      // --- BRANCH / INVOICE CONFIG (NEW) ---
      // Determine branch (defensive checks across possible fields)
      // Normalize branch to a fixed key
      console.log("Order details:", orderDetails);
      console.log("Order details:", orderDetails);

      const branchRaw =
        orderDetails?.branch ||
        customerDetails?.branch ||
        customerDetails?.branch_name ||
        clientInformation?.branch ||
        clientInformation?.branch_name;

      const branchMap = {
        HYD: "HYD",
        HYDERABAD: "HYD",
        VIZAG: "VIZAG",
        VSKP: "VIZAG",
        VZG: "VIZAG",
      };
      // const normalizedBranch = branchMap[branchRaw] || "HYD";
      const normalizedBranch = branchRaw
        ? branchMap[branchRaw.toUpperCase()] || "HYD"
        : "HYD";

      console.log(
        "Detected branch:",
        branchRaw,
        "→ Normalized branch:",
        normalizedBranch,
      );
      console.log("Order details:3", orderDetails);
      console.log("Order details:4", orderDetails);

      // Map branch -> invoice prefix
      const invoicePrefixMap = {
        HYD: "HYD/PI",
        VIZAG: "VSKP/PI",
      };
      // const invoicePrefix = invoicePrefixMap[branch] || invoicePrefixMap.HYD;
      const invoicePrefix =
        invoicePrefixMap[normalizedBranch] || invoicePrefixMap.HYD;
      const vizYear = getVizFinancialYear(dor);

      const yearStr = String(new Date(dor).getFullYear());
      const pnStr = String(pdfDetails.pn || "").padStart(4, "0");

      // final invoice number, e.g. HYD/PI/2025/0377
      const invoiceNumber = `${invoicePrefix}/${vizYear}/${pnStr}`;
      let footerText = "";

      if (normalizedBranch === "VIZAG") {
        footerText =
          "Plot No.93, E - Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh\nE-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495";
      } else if (normalizedBranch === "HYD") {
        footerText =
          "9th Floor, Pardha's Picasa, D Block, above Vijetha Supermarket, Kavuri Hills,\nMadhapur, Hyderabad, Telangana 500081\nE-mail: geotechnical.hyd@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912801114";
      }

      // keep old filename pattern for S3 storage
      const filenameInvoiceLabel = `Proforma-Invoice-${pnStr}`;
      const uniquePrefix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const fileName = `${uniquePrefix}/${filenameInvoiceLabel}.pdf`;
      // --- end BRANCH / INVOICE CONFIG ---
      // --- branch-specific configs (addresses & image fallbacks) ---
      const branchConfigs = {
        HYD: {
          invoiceAddress: `KDM Engineers (India) Pvt Ltd
9th Floor, Pardha's Picasa, D Block,
Above Vijetha Supermarket, Kavuri Hills,
Madhapur, Hyderabad, Telangana 500081
Ph: 040-48555333`,

          // HYD sign = sagarSign
          signImage:
            typeof sagarSign !== "undefined"
              ? sagarSign
              : typeof RKsign !== "undefined"
                ? RKsign
                : null,

          // HYD stamp fallback (use hydStamp if you have one)
        },

        VIZAG: {
          invoiceAddress: `KDM Engineers (India) Pvt Ltd
Some Vizag Address Line
Visakhapatnam - 5300XX
Ph: 0891-xxxxxxx`,

          signImage: typeof RKsign !== "undefined" ? RKsign : null,
        },
      };

      // const branchConfig = branchConfigs[branch] || branchConfigs.HYD;
      const branchConfig = branchConfigs[normalizedBranch] || branchConfigs.HYD;

      // --- end branch-specific configs ---

      // const fileName = `${invoiceNumber}.pdf`;
      const sample_data = geotechnicalItems.map((item) => ({
        sampleName: item.description || "N/A",
        qty: item.qty || 1,
        parameters: [
          {
            group: [item.description || "N/A"],
            price: parseFloat(item.rate) || 0,
            discountedPrice: parseFloat(item.rate) || 0,
            discipline: item.discipline || "GT",
          },
        ],
      }));

      // ----------------- GT Table Builder -----------------
      function createGTContent(gtData) {
        let total = 0;

        // Table header row
        const body = [
          [
            { text: "S.No", style: "tableHeader" },
            { text: "Description", style: "tableHeader" },
            { text: "Unit", style: "tableHeader" },
            { text: "Qty", style: "tableHeader" },
            { text: "Rate", style: "tableHeader" },
            { text: "Amount", style: "tableHeader" },
          ],
        ];

        gtData.forEach((item, index) => {
          const qty = parseFloat(item.qty || 0);
          const rate = parseFloat(item.rate || 0);
          const amount = qty * rate;
          total += amount;

          const rowColor = index % 2 === 0 ? "#ffffff" : "#f5f5f5"; // alternating row colors

          body.push([
            {
              text: index + 1,
              style: "tableCell",
              bold: true,
            },
            {
              text: item.description || "",
              style: "tableCell",
            },
            { text: item.unit || "", style: "tableCell" },
            { text: qty.toString(), style: "tableCell" },
            { text: rate.toFixed(2), style: "tableCell" },
            {
              text: amount.toFixed(2),
              style: "tableCell",
            },
          ]);
        });

        return { body, total };
      }
      // Utility: Convert number to words (supports up to crores)
      function convertNumberToWords(amount) {
        const words = [
          "",
          "One",
          "Two",
          "Three",
          "Four",
          "Five",
          "Six",
          "Seven",
          "Eight",
          "Nine",
          "Ten",
          "Eleven",
          "Twelve",
          "Thirteen",
          "Fourteen",
          "Fifteen",
          "Sixteen",
          "Seventeen",
          "Eighteen",
          "Nineteen",
        ];
        const tens = [
          "",
          "",
          "Twenty",
          "Thirty",
          "Forty",
          "Fifty",
          "Sixty",
          "Seventy",
          "Eighty",
          "Ninety",
        ];

        function numToWords(num) {
          if (num < 20) return words[num];
          if (num < 100)
            return (
              tens[Math.floor(num / 10)] +
              (num % 10 !== 0 ? " " + words[num % 10] : "")
            );
          if (num < 1000)
            return (
              words[Math.floor(num / 100)] +
              " Hundred" +
              (num % 100 !== 0 ? " " + numToWords(num % 100) : "")
            );
          if (num < 100000)
            return (
              numToWords(Math.floor(num / 1000)) +
              " Thousand" +
              (num % 1000 !== 0 ? " " + numToWords(num % 1000) : "")
            );
          if (num < 10000000)
            return (
              numToWords(Math.floor(num / 100000)) +
              " Lakh" +
              (num % 100000 !== 0 ? " " + numToWords(num % 100000) : "")
            );
          return (
            numToWords(Math.floor(num / 10000000)) +
            " Crore" +
            (num % 10000000 !== 0 ? " " + numToWords(num % 10000000) : "")
          );
        }

        const amt = Math.round(amount);
        return numToWords(amt);
      }

      function createGTDocDefinition(gtData) {
        const { body, total } = createGTContent(gtData);

        // Ensure total is a number
        const totalAmount = parseFloat(total) || 0;

        const subTotal = totalAmount + transportation_fee;
        // Determine GST type based on GST number starting with 36 = same state
        // const gstType = customerDetails.gstNumber?.startsWith("37")
        //   ? "CGST_SGST"
        //   : "IGST";
        // console.log(gstType, "gtst tuepe");
        // console.log(gstNumber, "uhnbhugvh");
        const gstNumber = customerDetails?.gst_number;
        const gstType = gstNumber?.startsWith("37") ? "CGST_SGST" : "IGST";
        console.log(gstType, "gtst type");
        console.log(gstNumber, "gst number used");

        // Calculate GST amounts
        const cgstAmount = gstType !== "IGST" ? subTotal * 0.09 : 0;
        const sgstAmount = gstType !== "IGST" ? subTotal * 0.09 : 0;
        const igstAmount = gstType === "IGST" ? subTotal * 0.18 : 0;

        const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount;
        const amountInWords = convertNumberToWords(grandTotal) + " Only";

        return {
          totalAgg: grandTotal,
          pageMargins: [40, 70, 40, 60],
          header: createHeader,
          footer: (currentPage, pageCount) => {
            let footerText = "";
            if (normalizedBranch === "VIZAG") {
              footerText =
                "Plot No.93, E - Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh\n" +
                "E-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495";
            } else {
              footerText =
                "9th Floor, Pardha's Picasa, D Block, above Vijetha Supermarket, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081\n" +
                "E-mail: geotechnical.hyd@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912801114";
            }

            return {
              stack: [
                {
                  canvas: [
                    {
                      type: "line",
                      x1: 0,
                      y1: 0,
                      x2: 600,
                      y2: 0,
                      lineWidth: 0.5,
                      lineColor: "#000000",
                    },
                  ],
                  margin: [0, 0, 0, 0],
                },
                {
                  text: footerText,
                  fontSize: 9,
                  alignment: "center",
                },
                {
                  text: `Page ${currentPage} of ${pageCount}`,
                  alignment: "right",
                  fontSize: 8,
                  margin: [0, 0, 5, 0],
                },
              ],
            };
          },

          background: (currentPage, pageCount) =>
            createWaterMark(currentPage, pageCount),
          content: [
            {
              text: "PROFORMA INVOICE",
              alignment: "center",
              fontSize: 15,
              margin: [0, 0, 0, 10],
              color: "red",
            },

            // Invoice Header
            ...createInvoiceHeader(
              customerDetails,
              orderDetails,
              pdfDetails,
              dor,
              clientInformation,
              selectedGst,
              invoiceNumber,
              normalizedBranch,
              branchConfig,
            ),

            // GT Table
            {
              style: "tableExample",
              table: {
                headerRows: 1,
                widths: ["auto", "*", "auto", "auto", "auto", "auto"],
                body,
              },
            },

            // Totals Table with borders
            // Convert total to words (you can use any utility function, here assuming `convertNumberToWords`)
            {
              layout: {
                hLineWidth: (i, node) => {
                  return i === 0 ? 0 : 1;
                },
                vLineWidth: () => 1,
              },
              table: {
                headerRows: 0,
                widths: ["*", "auto"],
                body: [
                  ...(transportation_fee > 0
                    ? [
                        [
                          {
                            text: "Transportation Fee",
                            alignment: "right",
                            bold: true,
                            fontSize: 10,
                          },
                          {
                            text: transportation_fee.toFixed(2),
                            alignment: "right",
                            fontSize: 10,
                          },
                        ],
                      ]
                    : []),
                  [
                    {
                      text: "Sub Total",
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                    {
                      text: subTotal.toFixed(2),
                      alignment: "right",
                      fontSize: 10,
                    },
                  ],
                  ...(gstType === "IGST"
                    ? [
                        [
                          {
                            text: "IGST (18%)",
                            alignment: "right",
                            bold: true,
                            fontSize: 10,
                          },
                          {
                            text: igstAmount.toFixed(2),
                            alignment: "right",
                            fontSize: 10,
                          },
                        ],
                      ]
                    : [
                        [
                          {
                            text: "CGST (9%)",
                            alignment: "right",
                            bold: true,
                            fontSize: 10,
                          },
                          {
                            text: cgstAmount.toFixed(2),
                            alignment: "right",
                            fontSize: 10,
                          },
                        ],
                        [
                          {
                            text: "SGST (9%)",
                            alignment: "right",
                            bold: true,
                            fontSize: 10,
                          },
                          {
                            text: sgstAmount.toFixed(2),
                            alignment: "right",
                            fontSize: 10,
                          },
                        ],
                      ]),
                  [
                    {
                      text: "Grand Total",
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                    {
                      text: grandTotal.toFixed(2),
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                  ],
                  [
                    {
                      text: "Amount in Words",
                      alignment: "right",
                      bold: true,
                      fontSize: 10,
                    },
                    { text: amountInWords, alignment: "right", fontSize: 10 },
                  ],
                ],
              },
              margin: [0, 0, 0, 0],
            },

            // QR & Signature (kept together on same page)
            {
              columns: [
                {
                  stack: [
                    {
                      text: "SCAN & PAY", // 👈 text above image
                      fontSize: 10,
                      alignment: "center",
                      margin: [0, -20, 0, 0],
                    },
                    {
                      image: qrScanner,
                      width: 70,
                      height: 70,
                      alignment: "left",
                      margin: [0, 2, 0, 15],
                    },
                  ],
                  width: "auto",
                },
                {
                  stack: [
                    {
                      text: "For KDM Engineers (India) Private Limited",
                      alignment: "right",
                      fontSize: 10,
                      margin: [0, -15, 0, 0],
                    },

                    // ✔ HYD vs VIZAG sign block
                    {
                      stack: [
                        normalizedBranch === "HYD"
                          ? {
                              // HYD → Sagar sign ONLY
                              image: branchConfig.signImage, // sagarSign must be in branchConfig
                              width: 90,
                              height: 35,
                              alignment: "right",
                              margin: [0, 6, 0, 0],
                            }
                          : {
                              // VIZAG → RK sign + Vizag stamp
                              stack: [
                                {
                                  image: RKsign,
                                  width: 90,
                                  height: 30,
                                  alignment: "right",
                                },
                                {
                                  image: vizagStamp,
                                  width: 65,
                                  height: 65,
                                  alignment: "right",
                                  margin: [0, -55, 0, 0],
                                },
                              ],
                            },
                      ],
                      alignment: "center",
                    },

                    {
                      text: "Authorized By",
                      fontSize: 9,
                      alignment: "right",
                      margin: [0, -5, 0, 0],
                    },

                    {
                      text:
                        normalizedBranch === "HYD"
                          ? "T.Sagar"
                          : "M.Ramakrishna",
                      fontSize: 9,
                      alignment: "right",
                      margin: [0, 0, 0, 0],
                    },
                  ],

                  width: "*",
                },
              ],
              margin: [0, 20, 0, 0],
            },

            {
              text: "Our Bank Details",
              alignment: "right",
              fontSize: 10,
              margin: [0, -10, 60, 8],
            },
            createPANAndBankDetailsTable(),
          ],
          styles: {
            tableHeader: { fontSize: 10, bold: true, fillColor: "#eeeeee" },
            tableCell: { fontSize: 9 },
            total: { fontSize: 10, margin: [0, 5, 0, 0] },
            totalBold: { fontSize: 10, bold: true, margin: [0, 5, 0, 0] },
          },
          defaultStyle: { font: "Roboto" },
        };
      }

      // ----------------- Generate PDF -----------------
      const docDefinationData = createGTDocDefinition(geotechnicalItems);
      const pdfDoc = printer.createPdfKitDocument(docDefinationData);

      const chunks = [];
      pdfDoc.on("data", (chunk) => chunks.push(chunk));
      pdfDoc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);

          const uploadParams = {
            Bucket: MATERIAL_TESTING_PROFORMAS,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          };

          await s3.upload(uploadParams).promise();

          resolve({
            location: fileName,
            proformaContent: docDefinationData.content.slice(1),
            totalAgg: docDefinationData.totalAgg,
            buffer: pdfBuffer,
            sample_data,
          });
        } catch (error) {
          reject(error);
        }
      });

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const createPANAndBankDetailsTable = () => {
  return {
    columns: [
      {
        width: "50%",
        alignment: "left",
        table: {
          widths: ["25%", "60%"],
          body: [
            [
              {
                text: "PAN",
                fontSize: 10,
              },
              {
                text: "AAECK9447L",
                fontSize: 10,
                width: 150,
              },
            ],
            [
              {
                text: "GSTIN",
                fontSize: 10,
              },
              {
                text: "37AAECK9447L2ZU",
                fontSize: 10,
              },
            ],
            [
              {
                text: "SAC",
                fontSize: 10,
              },
              {
                text: "998346",
                fontSize: 10,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
        },
      },

      {
        width: "50%",
        margin: [50, 0, 0, 0],
        table: {
          widths: ["30%", "70%"],
          body: [
            [
              {
                text: "Bank",
                fontSize: 10,
              },
              {
                text: "BANK OF INDIA",
                fontSize: 10,
              },
            ],
            [
              {
                text: "Branch",
                fontSize: 10,
              },
              {
                text: "Dilshukhnagar Branch",
                fontSize: 10,
              },
            ],
            [
              {
                text: "Account No",
                fontSize: 10,
              },
              {
                text: "864330110000070",
                fontSize: 10,
              },
            ],
            [
              {
                text: "IFSC Code",
                fontSize: 10,
              },
              {
                text: "BKID0008643",
                fontSize: 10,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
        },
      },
    ],
    columnGap: 10,
  };
};

const createInvoiceHeader = (
  customerDetails,
  orderDetails,
  pdfDetails,
  dor,
  clientInformation,
  selectedGst,
  invoiceNumber, // new: dynamic invoice number string
  branch,
  branchConfig,
) => {
  let { pan_number, gst_number, billing_name, billing_address } =
    customerDetails;
  const { ref, project_name, subject, order_number } = orderDetails;
  const { pn } = pdfDetails;

  if (Array.isArray(customerDetails.extra_gsts) && selectedGst !== gst_number) {
    const match = customerDetails.extra_gsts.find((g) => g.gst === selectedGst);
    if (match) {
      pan_number = match.pan_id;
      gst_number = match.gst;
      billing_address = match.bill_address;
    }
  }

  // console.log(customerDetails,selectedGst,'selectedGst345')

  const date = new Date(dor);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = `${date.getFullYear()}`;
  const monthShort = date.toLocaleString("default", { month: "short" });
  const strPN = `000${pn}`;

  const buyerDetailsBody = [
    [
      {
        text: "Buyer's Name",
        fontSize: 9,
        border: [false, false, false, false],
        width: 100,
      },
      {
        text: billing_name,
        fontSize: 10,
        border: [false, false, false, false],
      },
    ],
    [
      {
        text: "Address",
        fontSize: 9,
        border: [false, false, false, false],
        width: 100,
      },
      {
        text: billing_address,
        fontSize: 10,
        border: [false, false, false, false],
      },
    ],
    [
      {
        text: "PAN",
        fontSize: 9,
        border: [false, false, false, false],
        width: 100,
      },
      { text: pan_number, fontSize: 10, border: [false, false, false, false] },
    ],
    [
      {
        text: "GST IN",
        fontSize: 9,
        border: [false, false, false, false],
        width: 100,
      },
      { text: selectedGst, fontSize: 10, border: [false, false, false, false] },
    ],
    [
      {
        text: "Ref",
        fontSize: 9,
        border: [false, false, false, false],
        width: 100,
      },
      { text: ref, fontSize: 10, border: [false, false, false, false] },
    ],
  ];

  if (clientInformation?.reporting_name) {
    buyerDetailsBody.push([
      {
        text: "Client Name",
        fontSize: 9,
        border: [false, false, false, false],
        width: 100,
      },
      {
        text: clientInformation.reporting_name,
        fontSize: 10,
        border: [false, false, false, false],
      },
    ]);
  }
  const fizYear = getVizFinancialYear(dor);
  console.log(fizYear, "appy7394");
  // invoice table body
  const invoicePrefix = branch === "HYD" ? "HYD/PI" : "VSKP/PI";
  const invoiceTableBody = [
    [
      { text: " Invoice No:", fontSize: 10 },
      {
        text: `${invoicePrefix}/${fizYear}/${strPN.slice(-4)}`,
        fontSize: 10,
      },
    ],
    [
      { text: "Invoice Date:", fontSize: 10 },
      { text: `${day}/${monthShort}/${year}`, fontSize: 10 },
    ],
    [
      { text: "Order No:", fontSize: 10 },
      { text: `${month}/${year}/${order_number}`, fontSize: 10 },
    ],
    [
      { text: "Order Date:", fontSize: 10 },
      { text: `${day}/${monthShort}/${year}`, fontSize: 10 },
    ],
  ];

  const layout = [];

  // Top section: buyer details + invoice table
  layout.push({
    columns: [
      {
        width: "67%",
        table: {
          widths: [80, "auto"],
          body: buyerDetailsBody,
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
        },
      },
      {
        width: "33%",
        table: {
          widths: ["auto", "auto"],
          body: invoiceTableBody,
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
        },
      },
    ],
    margin: [0, 0, 0, 10],
  });

  if (subject?.trim() !== "") {
    layout.push({
      columns: [
        {
          width: "100%",
          table: {
            widths: [80, "auto"],
            body: [
              [
                {
                  text: "Subject",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: subject,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
        },
      ],
      // margin: [0, 0, 0, 10],
    });
  }
  if (project_name?.trim() !== "") {
    layout.push({
      columns: [
        {
          width: "100%",
          table: {
            widths: [80, "auto"],
            body: [
              [
                {
                  text: "Project",
                  fontSize: 9,
                  border: [false, false, false, false],
                  width: 100,
                },
                {
                  text: project_name,
                  fontSize: 10,
                  border: [false, false, false, false],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
          },
        },
      ],
      // margin: [0, 0, 0, 10],
    });
  }

  return layout;
};

// Function to create table content for the PDF
const createContent = (data, orderDetails, customerDetails, discountColumn) => {
  const { discount, transportation_fee } = orderDetails;
  const { gst_number } = customerDetails;

  let content = [];

  content.push(
    [
      { text: "S.No", style: "tableHeader" },
      { text: "Particulars", style: "tableHeader" },
      { text: "Price", style: "tableHeader" },
      { text: "Qty", style: "tableHeader" },
      discountColumn && { text: "Discount (%)", style: "tableHeader" },
      { text: "Amount", style: "tableHeader" },
    ].filter(Boolean),
  );

  let serialNumber = 1;
  let totalPrice = 0;

  data = data.map((sample) => {
    if (sample.sampleName === "Concrete" && Array.isArray(sample.parameters)) {
      const uniqueParams = [];

      sample.parameters.forEach((param) => {
        const isDuplicate = uniqueParams.some(
          (item) =>
            item.price === param.price &&
            JSON.stringify(item.group) === JSON.stringify(param.group) &&
            item.discipline === param.discipline,
        );

        if (!isDuplicate) {
          uniqueParams.push(param);
        }
      });

      return {
        ...sample,
        parameters: uniqueParams,
      };
    }
    return sample;
  });

  // console.log(data,'data345')
  data.forEach((sample) => {
    const row = [];
    console.log(sample, "sample234");
    // console.log( sample.parameters,'parameters234')
    row.push({
      text: serialNumber++,
      rowSpan: sample.parameters.length + 1,
      fontSize: 9,
    });

    row.push({
      text: `Testing of ${sample.sampleName}`,
      colSpan: discountColumn ? 5 : 4,
      fontSize: 9,
      bold: true,
    });

    for (let i = 0; i < (discountColumn ? 4 : 3); i++) {
      row.push("");
    }

    content.push(row);

    sample.parameters.forEach((param) => {
      const paramRow = [];

      const paramNames = param.group.join(",\n");
      const originalPrice = Number(param.price);
      const discountedPrice = Number(param.discountedPrice);
      const discountPercent234 = Number(param.discountOg) || 0;
      const qty = Number(sample.qty);
      // const total = (discountedPrice * qty).toFixed(2);
      const total = Math.round(discountedPrice * qty);
      // console.log(qty,discountedPrice,'too76')
      paramRow.push(""); // For S.No rowSpan
      paramRow.push({ text: paramNames, fontSize: 9 });
      paramRow.push({ text: originalPrice.toFixed(2), fontSize: 9 });
      paramRow.push({ text: qty, fontSize: 9 });

      if (discountColumn) {
        // const discountPercent =
        //   originalPrice > discountedPrice
        //     ? `${(((originalPrice - discountedPrice) / originalPrice) * 100)}%`
        //     : "0%";

        const discountPercent =
          originalPrice > discountedPrice ? `${discountPercent234}%` : "0%";
        console.log(
          originalPrice,
          discountedPrice,
          qty,
          total,
          discountPercent,
          "qtyValue786",
        );

        paramRow.push({ text: discountPercent, fontSize: 9 });
      }

      paramRow.push({ text: total, fontSize: 9 });

      totalPrice += discountedPrice * qty;

      content.push(paramRow);
    });
  });

  const discountAmount = calculateDiscountAmount(totalPrice, discount);
  const subTotal =
    totalPrice - discountAmount + parseFloat(transportation_fee || 0);
  // const totalGST = Math.round(calculateDiscountAmount(subTotal, 18));
  // const totalAgg = Math.round(subTotal + totalGST);
  const totalGST = Math.round(calculateDiscountAmount(subTotal, 18));
  const totalAgg = Math.round(subTotal + totalGST);

  console.log(
    subTotal,
    discount,
    totalPrice,
    transportation_fee,
    totalAgg,
    "subTotal356",
  );

  // Sub Total Row
  let row = [];
  row.push({
    text: "Sub Total",
    colSpan: 3,
    alignment: "right",
    fontSize: 10,
    bold: true,
  });
  row.push("", "");
  row.push({ text: "" });
  if (discountColumn) row.push({ text: "" });
  row.push({
    text: totalPrice.toFixed(2),
    fontSize: 10,
    bold: true,
  });
  content.push(row);

  // Transportation Charges Row
  if (transportation_fee > 0) {
    row = [];
    row.push({
      text: "Transportation Charges",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: "" });
    if (discountColumn) row.push({ text: "" });
    row.push({
      text: parseFloat(transportation_fee).toFixed(2),
      fontSize: 10,
      bold: true,
    });
    content.push(row);
  }

  // Final Subtotal after discount and transportation
  if (transportation_fee > 0) {
    row = [];
    row.push({
      text: "Sub Total",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: "" });
    if (discountColumn) row.push({ text: "" });
    row.push({
      text: subTotal.toFixed(2),
      fontSize: 10,
      bold: true,
    });
    content.push(row);
  }

  // GST Rows
  if (gst_number.startsWith("37")) {
    console.log(totalGST, "totalGST67");
    const halfGST = (totalGST / 2).toFixed(2);

    ["CGST", "SGST"].forEach((type) => {
      row = [];
      row.push({
        text: type,
        colSpan: 3,
        alignment: "right",
        fontSize: 10,
        bold: true,
      });
      row.push("", "");
      row.push({ text: "9%" });
      if (discountColumn) row.push({ text: "" });
      row.push({
        text: halfGST,
        fontSize: 10,
        bold: true,
      });
      content.push(row);
    });
  } else if (gst_number.includes("NOT REGISTERED")) {
    row = [];
    row.push({
      text: "GST",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: "18%" });
    if (discountColumn) row.push({ text: "" });
    row.push({
      text: totalGST.toFixed(2),
      fontSize: 10,
      bold: true,
    });
    content.push(row);
  } else {
    row = [];
    row.push({
      text: "IGST",
      colSpan: 3,
      alignment: "right",
      fontSize: 10,
      bold: true,
    });
    row.push("", "");
    row.push({ text: "18%" });
    if (discountColumn) row.push({ text: "" });
    row.push({
      text: totalGST.toFixed(2),
      fontSize: 10,
      bold: true,
    });
    content.push(row);
  }

  // Total Row
  row = [];
  row.push({
    text: "Total",
    colSpan: 3,
    alignment: "right",
    fontSize: 10,
    bold: true,
  });
  row.push("", "");
  row.push({ text: "" });
  if (discountColumn) row.push({ text: "" });
  row.push({
    text: totalAgg.toFixed(2),
    fontSize: 10,
    bold: true,
  });
  content.push(row);

  // Amount in Words
  const amountInWordsRow = [];
  amountInWordsRow.push({
    text: amountInWords(totalAgg),
    fontSize: 10,
    colSpan: discountColumn ? 6 : 5,
    italics: true,
    alignment: "right",
  });

  for (let i = 1; i < (discountColumn ? 6 : 5); i++) {
    amountInWordsRow.push("");
  }

  content.push(amountInWordsRow);

  return {
    content,
    totalAgg,
  };
};

// const docDefinition = (data, orderDetails, customerDetails) => ({billData, pdfDetails
const docDefinition = (
  data,
  billData,
  pdfDetails,
  dor,
  clientInformation,
  discountColumn,
  selectedGst,
  invoiceNumber, // already fixed earlier
  normalizedBranch, // ✅ ADD THIS
  branchConfig,
) => {
  const { orderDetails, customerDetails } = billData;

  console.log(selectedGst, "23def");

  const { content, totalAgg } = createContent(
    data,
    orderDetails,
    customerDetails,
    discountColumn,
  );

  const tableData = content;

  return {
    totalAgg: totalAgg,
    pageMargins: [40, 70, 40, 60],
    header: createHeader,
    footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
    content: [
      {
        text: "PROFORMA INVOICE",
        alignment: "center",
        fontSize: 15,
        margin: [0, 0, 0, 10],
        color: "red",
      },
      ...createInvoiceHeader(
        customerDetails,
        orderDetails,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
        invoiceNumber, // new: dynamic invoice number string
        normalizedBranch,
        branchConfig,
      ),
      {
        table: {
          headerRows: 1,
          widths: discountColumn
            ? ["auto", "*", "auto", "auto", "auto", "auto"]
            : ["auto", "*", "auto", "auto", "auto"],
          body: tableData,
        },
      },

      {
        columns: [
          {
            stack: [
              {
                text: "SCAN & PAY",
                fontSize: 10,
                alignment: "center",
                margin: [0, 5, 0, 0],
              },
              {
                image: qrScanner,
                width: 70,
                height: 70,
                alignment: "left",
                margin: [0, 2, 0, 15],
              },
            ],
            width: "auto",
          },
          {
            stack: [
              {
                text: "For KDM Engineers (India) Private Limited",
                alignment: "right",
                fontSize: 10,
                margin: [0, 5, 0, 0],
              },

              // ✔ branch-aware sign & stamp (case-insensitive)
              normalizedBranch === "HYD"
                ? {
                    // HYD → Sagar Sign ONLY (NO STAMP)
                    image: sagarSign,
                    width: 90,
                    height: 35,
                    alignment: "right",
                    margin: [0, 0, 0, 0],
                  }
                : {
                    // VIZAG → RK Sign + Vizag stamp
                    stack: [
                      {
                        image: RKsign,
                        width: 90,
                        height: 30,
                        alignment: "right",
                      },
                      {
                        image: vizagStamp,
                        width: 65,
                        height: 65,
                        alignment: "right",
                        margin: [0, -55, 0, 0],
                      },
                    ],
                  },

              {
                text: "Authorized By",
                fontSize: 9,
                alignment: "right",
                margin: [0, -5, 0, 0],
              },

              {
                text: normalizedBranch === "HYD" ? "T.Sagar" : "M.Ramakrishna",
                fontSize: 9,
                alignment: "right",
              },
            ],
            width: "*",
          },
        ],
        margin: [0, 5, 0, 0],
      },

      {
        text: "Our Bank Details",
        alignment: "right",
        fontSize: 10,
        margin: [0, -15, 60, 8],
      },

      createPANAndBankDetailsTable(),
    ],

    background: (currentPage, pageCount) =>
      createWaterMark(currentPage, pageCount),
    styles: {
      title: {
        fontSize: 24,
        bold: true,
      },
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      tableHeader: {
        fontSize: 10,
        color: "black",
        fillColor: "#CCCCCC",
      },
      defaultStyle: {
        font: "Roboto",
      },
      listItem: {
        fontSize: 8,
      },
    },
  };
};

const generateProformaInvoice = (
  billData,
  pdfDetails,
  dor = new Date(),
  clientInformation = {},
  selectedGst,
) => {
  return new Promise((resolve, reject) => {
    try {
      let { selectedSamples } = billData;
      const { pdf_name } = pdfDetails;
      const year = new Date().getFullYear();

      const invoiceNumber = `Proforma-Invoice-${String(pdfDetails.pn).padStart(4, "0")}`;
      const uniquePrefix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const fileName = `${uniquePrefix}/${invoiceNumber}.pdf`;

      // const fileName = `${invoiceNumber}.pdf`;
      const uniqueNumber =
        Date.now() + Math.floor(Math.random() * 1000).toString();

      if (typeof selectedSamples === "string") {
        selectedSamples = JSON.parse(selectedSamples);
      }

      let discountColumn = false;
      console.log(selectedSamples, "selectedGst123");
      const formattedData = selectedSamples?.map((eachSample) => {
        const {
          sampleName,
          isOffer,
          offer,
          qty,
          chemicalParams = [],
          physicalParams = [],
        } = eachSample;

        const hasDiscount = [...chemicalParams, ...physicalParams].some(
          (eachParam) => eachParam.price - eachParam.discountedPrice > 0,
        );

        if (hasDiscount) {
          discountColumn = true;
        }

        const parameters = [
          ...chemicalParams?.map((eachParam) => {
            const parsedParams = JSON.parse(eachParam.params);
            return {
              price: eachParam.price,
              group: parsedParams?.map((eachTest) => eachTest.testName),
              discipline: eachParam.discipline,
              discountedPrice: eachParam.discountedPrice,
              discountOg: eachParam.discount,
            };
          }),
          ...physicalParams?.map((eachParam) => {
            const parsedParams = JSON.parse(eachParam.params);
            return {
              price: eachParam.price,
              group: parsedParams?.map((eachTest) => eachTest.testName),
              discipline: eachParam.discipline,
              discountedPrice: eachParam.discountedPrice,
              discountOg: eachParam.discount,
            };
          }),
        ];

        return {
          sampleName,
          isOffer,
          offer,
          qty,
          parameters,
        };
      });
      // ----- ADD THIS BLOCK -----
      const branchRaw =
        billData?.orderDetails?.branch ||
        billData?.customerDetails?.branch ||
        billData?.customerDetails?.branch_name ||
        billData?.customerDetails?.customer_branch ||
        clientInformation?.branch ||
        clientInformation?.branch_name;

      const branchMap = {
        HYDERABAD: "HYD",
        SECUNDERABAD: "HYD",
        HYD: "HYD",
        LB: "HYD",
        VIZAG: "VIZAG",
        VSKP: "VIZAG",
        VISAKHAPATNAM: "VIZAG",
      };

      let normalizedBranch;
      const division = billData?.orderDetails?.division;

      // 🔒 ONLY GT can change branch
      if (division !== "GT") {
        normalizedBranch = "VIZAG";
      } else {
        normalizedBranch = branchRaw
          ? branchMap[branchRaw.toUpperCase()] || "HYD"
          : "HYD";
      }

      const branchConfig = {
        HYD: {
          phone: "040-123456",
          signPhy: "hyd_phy.png",
          signChem: "hyd_chem.png",
        },
        VIZAG: {
          phone: "0891-654321",
          signPhy: "vizag_phy.png",
          signChem: "vizag_chem.png",
        },
      };
      // ----- END BLOCK -----

      const docDefinationData = docDefinition(
        formattedData,
        billData,
        pdfDetails,
        dor,
        clientInformation,
        discountColumn,
        selectedGst,
        invoiceNumber,
        normalizedBranch,
        branchConfig,
      );
      console.log("FINAL BRANCH USED:", normalizedBranch);

      const pdfDoc = printer.createPdfKitDocument(docDefinationData);

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
          const uploadParams = {
            Bucket: MATERIAL_TESTING_PROFORMAS,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          };

          let chech87 = await s3.upload(uploadParams).promise();

          const location = fileName;

          // console.log(chech87.location, chech87, "location326");

          const proformaData = {
            location,
            proformaContent: docDefinationData.content.slice(1),
            totalAgg: docDefinationData.totalAgg, //total aggregate
            buffer: pdfBuffer,
          };
          console.log("UPLOAD RESPONSE:", chech87);

          // Resolve the promise with the location
          resolve(proformaData);
        } catch (error) {
          console.error("Error handling PDF document completion:", error);
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

module.exports = {
  generateProformaInvoice,
  generateGeotechProformaInvoice,
  createPANAndBankDetailsTable,
  generateNdtProformaInvoice,
};

// const createInvoiceHeader = (
//   customerDetails,
//   orderDetails,
//   pdfDetails,
//   dor,
//   clientInformation
// ) => {
//   const { pan_number, gst_number, billing_name, billing_address } =
//     customerDetails;
//   const { ref, project_name, subject, order_number } = orderDetails;
//   const { pn } = pdfDetails;

//   // console.table(orderDetails);

//   const date = new Date(dor);
//   const day = date.getDate();
//   const month = date.getMonth() + 1;
//   const year = `${date.getFullYear()}`;
//   const monthShort = date.toLocaleString("default", { month: "short" });

//   const strPN = `000${pn}`;

//   const buyerDetailsBody = [
//     [
//       {
//         text: "Buyer's Name",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       {
//         text: billing_name,
//         fontSize: 10,
//         border: [false, false, false, false],
//       },
//     ],
//     [
//       {
//         text: "Address",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       {
//         text: billing_address,
//         fontSize: 10,
//         border: [false, false, false, false],
//       },
//     ],
//     [
//       {
//         text: "PAN",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       { text: pan_number, fontSize: 10, border: [false, false, false, false] },
//     ],
//     [
//       {
//         text: "GST IN",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       { text: gst_number, fontSize: 10, border: [false, false, false, false] },
//     ],
//   ];

//   buyerDetailsBody.push([
//     {
//       text: "Ref",
//       fontSize: 9,
//       border: [false, false, false, false],
//       width: 100,
//     },
//     { text: ref, fontSize: 10, border: [false, false, false, false] },
//   ]);

//   if (subject.trim() !== "") {
//     buyerDetailsBody.push([
//       {
//         text: "Subject",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       { text: subject, fontSize: 10, border: [false, false, false, false] },
//     ]);
//   }

//   if (project_name.trim() !== "") {
//     buyerDetailsBody.push([
//       {
//         text: "Project",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       {
//         text: project_name,
//         fontSize: 10,
//         border: [false, false, false, false],
//       },
//     ]);
//   }

//   if (clientInformation?.reporting_name) {
//     buyerDetailsBody.push([
//       {
//         text: "Client Name",
//         fontSize: 9,
//         border: [false, false, false, false],
//         width: 100,
//       },
//       {
//         text: clientInformation.reporting_name,
//         fontSize: 10,
//         border: [false, false, false, false],
//       },
//     ]);
//   }

//   return [
//     {
//       columns: [
//         {
//           width: "70%",
//           table: {
//             widths: [80, "auto"],
//             body: buyerDetailsBody,
//           },
//           layout: {
//             hLineWidth: () => 0,
//             vLineWidth: () => 0,
//           },
//         },
//         {
//           width: "30%",
//           table: {
//             widths: ["auto", "auto"],
//             body: [
//               [
//                 { text: "I.No:", fontSize: 10 },
//                 { text: `VSKP/PI/${year}/${strPN.slice(-4)}`, fontSize: 10 },
//               ],
//               [
//                 { text: "I.Date:", fontSize: 10 },
//                 { text: `${day}/${monthShort}/${year}`, fontSize: 10 },
//               ],
//               [
//                 { text: "Ord No:", fontSize: 10 },
//                 { text: `${month}/${year}/${order_number}`, fontSize: 10 },
//               ],
//               [
//                 { text: "Ord Date:", fontSize: 10 },
//                 { text: `${day}/${monthShort}/${year}`, fontSize: 10 },
//               ],
//             ],
//           },
//           layout: {
//             hLineWidth: () => 1,
//             vLineWidth: () => 1,
//           },
//         },
//       ],
//       margin: [0, 0, 0, 10],
//     },
//   ];
// };

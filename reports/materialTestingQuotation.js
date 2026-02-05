const { MaterialTestingQuotation, NdtQuotation } = require("../models/index");

const PdfPrinter = require("pdfmake");
const path = require("path");
const { Op } = require("sequelize");

const { createHeader } = require("./header");
const { createFooter } = require("./footer");
const createWaterMark = require("./waterMark.js");
require("dotenv").config();
const mtQuotationBusket = process.env.MATERIAL_TESTING_QUOTATIONS;

const { qrScanner, RKsign } = require("./filePaths");

const generateQuotationRef = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let startYear, endYear;
  if (month >= 4) {
    startYear = year % 100;
    endYear = (year + 1) % 100;
  } else {
    startYear = (year - 1) % 100;
    endYear = year % 100;
  }

  const fy = `${String(startYear).padStart(2, "0")}-${String(endYear).padStart(2, "0")}`;

  // Get ONLY valid IDs (correct prefix)
  const lastQuotation = await MaterialTestingQuotation.findOne({
    where: {
      qtn_id: {
        [Op.like]: `${fy}/Lab-%`,
      },
    },
    order: [["qtn_id", "DESC"]],
  });

  let nextNumber = 1;

  if (lastQuotation && lastQuotation.qtn_id) {
    const match = lastQuotation.qtn_id.match(/Lab-(\d{3})$/);

    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  const serial = String(nextNumber).padStart(3, "0");
  return `${fy}/Lab-${serial}`;
};

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear().toString();
  let month = (now.getMonth() + 1).toString();
  let day = now.getDate().toString();
  let hours = now.getHours().toString();
  let minutes = now.getMinutes().toString();
  let seconds = now.getSeconds().toString();
  let milliseconds = now.getMilliseconds().toString();

  month = month.padStart(2, "0");
  day = day.padStart(2, "0");
  hours = hours.padStart(2, "0");
  minutes = minutes.padStart(2, "0");
  seconds = seconds.padStart(2, "0");
  milliseconds = milliseconds.padStart(3, "0");

  const dateTimeString = `${day}${month}${year}${hours}${minutes}${seconds}${milliseconds}`;
  return dateTimeString;
}

//aws
const AWS = require("aws-sdk");

const {
  amountInWords,
  calculateDiscountAmount,
} = require("../defs/customFunctions.js");
const { createPANAndBankDetailsTable } = require("./proformaInvoice.js");

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

const createTermsOfPayments = (transportation_fee) => {
  const terms = [
    {
      text: `Note :- The work will begin once 100% of the advance payment has been given with the work order.`,
      color: "#2596be",
      italics: true,
      fontSize: 10,
      margin: [0, 2, 0, 6],
    },
    { text: "Terms of Payment:", fontSize: 9, bold: true },
    {
      text: `\t 1. Balance amount if any prior to the submission of report`,
      fontSize: 10,
      margin: [16, 2, 0, 0],
    },
    {
      text: "\t 2. Witness Charges will be 100% Extra (or) Equal to the test charges per person",
      fontSize: 10,
      margin: [16, 2, 0, 0],
    },
    {
      text: "\t 3. This quotation is valid up to 15 days from the date of creation.",
      color: "red",
      fontSize: 10,
      margin: [16, 2, 0, 0],
    },
    {
      text: "All the payment shall be made in favour of KDM Engineer's (India) Pvt. Ltd. Payable at Hyderabad.",
      fontSize: 10,
      margin: [0, 16, 0, 0],
      color: "green",
    },
  ];

  if (transportation_fee <= 0) {
    terms.splice(5, 0, {
      text: "\t 4. Transportation Charges will be Rs 1200 per Trip If site with in ORR Limits (or) if out of ORR limits Transportation Charges will be Rs 20/Km will be charged extra",
      fontSize: 10,
      margin: [16, 2, 0, 0],
    });
  }

  return terms;
};

const createContent = (
  data,
  contactInfo,
  dateDay,
  showDiscountColumn,
  total_amount,
  showAmount
) => {
  const { name, mobile, transportation_fee, address, email } = contactInfo;
  const { date } = dateDay;
  const content = [];

  // console.log( name, mobile, transportation_fee, address, email,date,'ikda varku ok')

  const extracolums = showDiscountColumn ? 2 : 0;

  // console.log(showDiscountColumn,'showDiscountColumn23')

  // ---- define widths early so dynamic colSpan can use it ----
  const widths = [
    "auto", // S.No
    "*", // Particulars
    "auto", // Original Price
    ...(extracolums ? ["auto", "auto"] : []), // Discount + Price after discount
    "auto", // Qty
    "auto", // Total Price
  ];
  const totalColumns = widths.length; // dynamic total columns count
  const dynamicColSpan = totalColumns - 2; // all columns except last two

  // table header
  content.push([
    { text: "S.No", style: "tableHeader" },
    { text: "Particulars", style: "tableHeader" },
    { text: "Price", style: "tableHeader" },
    // { text: "Price", style: "tableHeader" },
    ...(extracolums
      ? [
          { text: "Discount", style: "tableHeader" },
          { text: "Price after discount", style: "tableHeader" },
        ]
      : []),
    { text: "Qty", style: "tableHeader" },
    { text: "Total Price", style: "tableHeader" },
  ]);

  let serialNumber = 1;
  let totalPrice = 0;
  data.forEach((sample) => {
    const row = [];
    row.push({
      text: serialNumber++,
      rowSpan: sample.parameters.length + 1,
      fontSize: 9,
    });
    row.push({
      text: `Testing of ${sample.sampleName}`,
      colSpan: 4 + extracolums,
      fontSize: 9,
      bold: true,
    });

    content.push(row);
    sample.parameters.forEach((param) => {
      const paramNames = param.group.join("\n");
      const paramRow = [];

      paramRow.push("");
      paramRow.push({
        text: paramNames,
        fontSize: 9,
      });

      paramRow.push({
        text: Math.round(Number(param.originalPrice)),
        fontSize: 9,
      });
      if (extracolums) {
        paramRow.push({
          text: `${Math.round(Number(param.discount))} %`,
          fontSize: 9,
        });
        paramRow.push({
          text: Math.round(Number(param.discountedPrice)),
          fontSize: 9,
        });
      }
      paramRow.push({
        text: sample.qty,
        fontSize: 9,
      });
      paramRow.push({
        text: Math.round(
          Number(param.discountedPrice) * parseInt(sample.qty, 10)
        ),
        fontSize: 9,
      });

      // accumulate accurately as number
      totalPrice += Number(param.discountedPrice) * parseInt(sample.qty, 10);
      content.push(paramRow);
    });
  });

  // transport fee: ensure numeric
  const transportFeeNum = parseFloat(transportation_fee) || 0;
  if (Math.abs(transportFeeNum) > 0) {
    // ---- Transportation Row ----

    const transportationRow = [];
    transportationRow.push({
      text: "Transportation Fee",
      fontSize: 10,
      colSpan: dynamicColSpan,
      alignment: "right",
      bold: true,
    });
    for (let i = 1; i < dynamicColSpan; i++) {
      transportationRow.push("");
    }
    transportationRow.push("");
    transportationRow.push({
      text: transportation_fee,
      alignment: "left",
      fontSize: 10,
    });
    content.push(transportationRow);
  }

  if (showAmount) {
    // ---- Subtotal row ----
    const totalBase = parseFloat(total_amount) || 0;
    const subtotalRow = [];
    subtotalRow.push({
      text: "Sub total",
      fontSize: 10,
      colSpan: dynamicColSpan,
      alignment: "right",
      bold: true,
    });
    for (let i = 1; i < dynamicColSpan; i++) {
      subtotalRow.push("");
    }
    subtotalRow.push(""); // second-to-last col
    subtotalRow.push({
      text: Math.round(totalBase),
      alignment: "left",
      bold: true,
      fontSize: 10,
    });
    content.push(subtotalRow);

    // ---- GST row ----
    const gstAmountNum = Math.round(totalBase * 0.18);
    const gstRow = [];
    gstRow.push({
      text: "GST",
      fontSize: 10,
      colSpan: dynamicColSpan,
      alignment: "right",
      bold: true,
    });
    for (let i = 1; i < dynamicColSpan; i++) {
      gstRow.push("");
    }
    gstRow.push("18%");
    gstRow.push({ text: gstAmountNum, alignment: "left", fontSize: 10 });
    content.push(gstRow);

    // ---- Total row ----
    const totalWithGstNum = Math.round(totalBase + gstAmountNum);
    const totalRow = [];
    totalRow.push({
      text: "Total",
      fontSize: 10,
      colSpan: dynamicColSpan,
      alignment: "right",
      bold: true,
    });
    for (let i = 1; i < dynamicColSpan; i++) {
      totalRow.push("");
    }
    totalRow.push("");
    totalRow.push({
      text: totalWithGstNum,
      alignment: "left",
      bold: true,
      fontSize: 10,
    });

    if (showAmount) {
      content.push(totalRow);
    }
  } else {
    const transportationRow = [];
    transportationRow.push({
      text: `18% GST extra on quoted price`,
      fontSize: 10,
      colSpan: totalColumns,
      italics: true,
      alignment: "right",
    });
    for (let i = 1; i < totalColumns; i++) {
      transportationRow.push("");
    }
    content.push(transportationRow);
  }

  // subtotal (recipient block)
  let row = [];

  let recipientText = [
    { text: `REF: KDMEIPL/Quote/${date}\n`, bold: true },
    { text: "To,\n" },
    { text: `${address}\n` },
  ];
  recipientText.push({ text: `Name: ${name}\n` });
  if (mobile) {
    recipientText.push({ text: `Phone: ${mobile}\n` });
  }

  if (email) {
    recipientText.push({ text: `Email: ${email}\n` });
  }
  const locationString =
    "https://www.google.com/maps/place/17.695335621683412,83.17761359850748";
  return [
    {
      columns: [
        {
          width: "*",
          text: [...recipientText],
          alignment: "left",
          fontSize: 10,
        },
        {
          width: "*",
          stack: [
            {
              text: `Date: ${new Date()
                .toLocaleDateString("en-GB")
                .replace(/\//g, ".")}\n`,
            },
            {
              text: `Day: ${new Date().toLocaleDateString("en-US", {
                weekday: "long",
              })}     `,
            },
          ],
          alignment: "right",
        },
      ],
      margin: [0, 0, 0, 0],
    },

    {
      text: "QUOTATION",
      alignment: "center",
      fontSize: 14,
      bold: true,
      margin: [0, 10, 0, 0],
      color: "#000",
    },

    {
      text: "Firstly, thank you for your interest in KDM Engineer's Group. We appreciate the opportunity to provide you with a quotation for Selected samples in our website.Based on your requirements, here is an quotation for your convenience",
      fontSize: 10,
      margin: [2, 5, 2, 10],
    },

    {
      table: {
        headerRows: 1,
        widths,
        body: content,
      },
    },

    {
      text: "All the payment shall be made in favour of KDM Engineer's (India) Pvt. Ltd. Payable at Hyderabad.",
      fontSize: 10,
      margin: [0, 16, 0, 0],
      color: "#000308",
      alignment: "center",
    },

    {
      text: "Our bank details",
      fontSize: 10,
      margin: [312, 20, 2, 5],
      color: "#000308",
    },
    createPANAndBankDetailsTable(),

    {
      columns: [
        {
          stack: [
            { text: "SCAN & PAY", fontSize: 10, margin: [0, 0, 0, 2] },
            { image: qrScanner, width: 70, height: 70 },
          ],
          width: "auto",
        },
        {
          stack: [
            {
              text: "LOCATION",
              fontSize: 10,
              alignment: "center",
              margin: [0, 0, 0, 2],
            },
            {
              qr: locationString,
              fit: 80,
              // width: 45,
              // height: 45,
              alignment: "center",
              // margin: [0, 0, 0, -20],
            },
          ],
        },
        {
          width: 200,
          stack: [
            {
              text: "For KDM Engineers (India) Private Limited",
              alignment: "right",
              fontSize: 10,
            },
            {
              image: RKsign,
              width: 90,
              height: 30,
              alignment: "center",
              margin: [0, 6, 0, 0],
            },
            {
              text: "Authorised Signatory By",
              alignment: "center",
              fontSize: 9,
              margin: [0, 6, 0, 0],
            },
            {
              text: "M.Ramakrishna",
              fontSize: 9,
              alignment: "center",
              margin: [0, 2, 0, 0],
            },
          ],
          unbreakable: true,
        },
      ],
      margin: [0, 12, 0, 0],
      columnGap: 20,
      margin: [0, 20, 0, 0],
      unbreakable: true,
    },
  ];
};

const docDefinition = (
  data,
  contactInfo,
  dateDay,
  showDiscountColumn,
  total_amount,
  showAmount,
  screenData
) => ({
  // pageMargins: [40, 90, 40, 70],
  pageMargins: [40, 90, 40, 50],

  header: createHeader,
  footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
  content: createContent(
    data,
    contactInfo,
    dateDay,
    showDiscountColumn,
    total_amount,
    showAmount,
    screenData
  ),
  background: (currentPage, pageCount) =>
    createWaterMark(currentPage, pageCount),
  styles: {
    title: { fontSize: 24, bold: true },
    header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
    tableHeader: {
      fontSize: 10,
      color: "black",
      fillColor: "#CCCCCC",
    },
    defaultStyle: { font: "Roboto" },
    listItem: { fontSize: 8 },
  },
});

const materialTestingQuotation = async (req, res) => {
  try {
    const {
      qtn_id,
      contactInfo,
      samples,
      total_amount,
      showDiscountColumn,
      showAmount,
      screenData,
    } = req.body;

    const { name, email, mobile, transportation_fee, discount } = contactInfo;
    const qtnRef = await generateQuotationRef();
    const dateDay = { date: qtnRef };

    const pdfDoc = printer.createPdfKitDocument(
      docDefinition(
        samples,
        contactInfo,
        dateDay,
        showDiscountColumn,
        total_amount,
        showAmount,
        screenData
      )
    );

    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        // const quotationName = `quotation-${date}.pdf`;
        const customerName = contactInfo.name
          ? contactInfo.address
              ?.split("\n")[0]
              .replace(/[^a-zA-Z0-9]/g, "-")
              .toUpperCase()
          : "customer";

        const quotationName = `KDMEIPL/Quote/${qtnRef}.pdf`;

        const uploadParams = {
          Bucket: mtQuotationBusket,
          Key: quotationName,
          Body: pdfBuffer,
          ContentType: "application/pdf",
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        const location = uploadResult.Location;

        // let dbResponse;

        let dbResponse;

        if (qtn_id) {
          // ✅ UPDATE Existing Record
          dbResponse = await MaterialTestingQuotation.findOne({
            where: { qtn_id },
          });

          if (dbResponse) {
            // Update existing record with new PDF & data
            await dbResponse.update({
              qtn_id, // keep same reference
              location: quotationName,
              created_by: name,
              contact: mobile,
              email,
              total_amount,
              discount: discount || 0,
              transportation_fee,
              screen_data: screenData,
            });
          } else {
            // If not found (record deleted or invalid qtn_id), create new
            dbResponse = await MaterialTestingQuotation.create({
              qtn_id: qtnRef,
              location: quotationName,
              created_by: name,
              contact: mobile,
              email,
              total_amount,
              discount: discount || 0,
              transportation_fee,
              screen_data: screenData,
            });
          }
        } else {
          // ✅ CREATE New Record
          dbResponse = await MaterialTestingQuotation.create({
            qtn_id: qtnRef,
            location: quotationName,
            created_by: name,
            contact: mobile,
            email,
            total_amount,
            discount: discount || 0,
            transportation_fee,
            screen_data: screenData,
          });
        }

        return res.status(200).json({ data: dbResponse });
      } catch (error) {
        console.error("Error handling PDF document completion:", error);
        return res.status(500).send({
          error:
            "Failed to generate Quotation, please check your network or contact ADMIN",
          link: "",
          profoma_generated: false,
        });
      }
    });

    pdfDoc.end();
  } catch (error) {
    console.error("Error creating PDF:", error);
    return res.status(500).send({ error: "Error generating Quotation" });
  }
};

// Delete a quotation by ID
// Controller
const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.body;

    // console.log('trfhtur23')

    const deletedCount = await MaterialTestingQuotation.destroy({
      where: { qtn_id: id },
    });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: `Quotation with id ${id} not found.` });
    }

    return res
      .status(200)
      .json({ message: `Quotation ${id} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting quotation:", error);
    res.status(500).json({ error: "Failed to delete quotation." });
  }
};

const getNDTquotationsController = async (req, res) => {
  try {
    const quotations = await NdtQuotation.findAll({
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({ data: quotations });
  } catch (error) {
    console.error("Error fetching Quotations:", error);
    res.status(500).json({ message: "Failed to fetch Quotations" });
  }
};

module.exports = {
  materialTestingQuotation,
  getCurrentDateTime,
  createTermsOfPayments,
  deleteQuotation,
  getNDTquotationsController,
};

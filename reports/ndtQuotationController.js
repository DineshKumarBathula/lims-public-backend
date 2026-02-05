const { NdtQuotation } = require("../models");
const PdfPrinter = require("pdfmake");
const path = require("path");
const AWS = require("aws-sdk");
const { Op } = require("sequelize");
require("dotenv").config();

const { qrScanner, RKsign } = require("./filePaths");
const { createHeader } = require("./header");
const { createFooter } = require("./footer");
const createWaterMark = require("./waterMark");
const { createPANAndBankDetailsTable } = require("./proformaInvoice");

const mtQuotationBusket = process.env.MATERIAL_TESTING_QUOTATIONS;

const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// ----------------- PDF Content -----------------
const createNdtContent = (data, contactInfo, qtnRef) => {
  const { name, mobile, address, email, emp } = contactInfo;
  const { employee_name } = data;
  const content = [];

  const recipient = [
    { text: `REF: ${qtnRef}\n`, bold: true, fontSize: 9 },
    { text: "To,", fontSize: 9 },
    { text: `${address}\n`, margin: [0, 2, 0, 0], fontSize: 9 },
    { text: `Name: ${employee_name}\n`, fontSize: 9 },
    mobile ? { text: `Phone: ${mobile}\n`, fontSize: 9 } : {},
    email ? { text: `Email: ${email}\n`, fontSize: 9 } : {},
  ];

  content.push({
    columns: [
      { width: "*", stack: recipient },
      {
        width: "*",
        text: `Date: ${new Date().toLocaleDateString()}`,
        alignment: "right",
      },
    ],
  });

  content.push({
    text: "QUOTATION",
    alignment: "center",
    fontSize: 12,
    bold: true,
    margin: [0, 10, 0, 10],
  });

  content.push({
    text: `Greetings! \n \t${data.subject} \n Sub: With reference to the above subject`,
    alignment: "left",
    fontSize: 9,
  });

  const tableBody = [
    [
      { text: "S.No", style: "tableHeader" },
      { text: "Description", style: "tableHeader" },
      { text: "Unit", style: "tableHeader" },
      { text: "Qty", style: "tableHeader" },
      { text: "Price", style: "tableHeader" },
      { text: "Total", style: "tableHeader" },
    ],
  ];

  let serial = 1;
  data.items.forEach((item) => {
    tableBody.push([
      { text: serial++, fontSize: 9 },
      { text: item.description, fontSize: 9 },
      { text: item.unit, fontSize: 9 },
      { text: item.qty.toString(), fontSize: 9 },
      { text: item.price.toFixed(2), fontSize: 9 },
      { text: item.total.toFixed(2), fontSize: 9 },
    ]);
  });

  if (data.showAmount) {
    tableBody.push([
      { text: "Subtotal", colSpan: 5, alignment: "right", fontSize: 9 },
      {},
      {},
      {},
      {},
      { text: data.subtotal.toFixed(2), fontSize: 9 },
    ]);

    tableBody.push([
      { text: "GST (18%)", colSpan: 5, alignment: "right", fontSize: 9 },
      {},
      {},
      {},
      {},
      { text: data.gst.toFixed(2), fontSize: 9 },
    ]);

    tableBody.push([
      { text: "Total", colSpan: 5, alignment: "right", fontSize: 9 },
      {},
      {},
      {},
      {},
      { text: data.total.toFixed(2), bold: true, fontSize: 9 },
    ]);
  } else {
    tableBody.push([
      {
        text: "18% GST extra on quoted price",
        colSpan: 6,
        alignment: "right",
        fontSize: 9,
      },
      {},
      {},
      {},
      {},
      {},
    ]);
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ["auto", "*", "auto", "auto", "auto", "auto"],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#000",
      vLineColor: () => "#000",
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 2,
      paddingBottom: () => 2,
    },
  });

  if (data.paymentTerms?.length) {
    content.push({
      text: "Payment Terms:",
      bold: true,
      margin: [0, 5, 0, 2],
      fontSize: 9,
    });
    data.paymentTerms.forEach((term, i) =>
      content.push({ text: `${i + 1}. ${term}`, fontSize: 9 }),
    );
  }

  if (data.conditions?.length) {
    content.push({
      text: "Conditions:",
      bold: true,
      margin: [0, 5, 0, 2],
      fontSize: 9,
    });
    data.conditions.forEach((c, i) =>
      content.push({ text: `${i + 1}. ${c}`, fontSize: 9 }),
    );
  }

  content.push({
    text: "All the payment shall be made in favour of KDM Engineer's (India) Pvt. Ltd. Payable at Hyderabad.",
    fontSize: 9,
    margin: [0, 16, 0, 0],
    color: "green",
  });
  content.push({
    text: "Thanking you and awaiting for a positive reply.\nYours sincerely,\nKDM ENGINEERS (INDIA) PVT. LTD.",
    fontSize: 10,
    margin: [0, 8, 0, 8],
  });

  content.push(createPANAndBankDetailsTable());

  content.push({
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
  });

  return content;
};
const locationString =
  "https://www.google.com/maps/place/17.695335621683412,83.17761359850748";

// ----------------- Controller -----------------
// ----------------- Controller -----------------
// ----------------- Controller -----------------
const createNdtQuotation = async (req, res) => {
  try {
    const { data } = req.body;

    // Generate financial year (e.g., 25-26)
    const now = new Date();
    let year = now.getFullYear();
    let nextYear = year + 1;

    if (now.getMonth() + 1 < 4) {
      year -= 1;
      nextYear -= 1;
    }

    const financialYear = `${String(year).slice(-2)}-${String(nextYear).slice(-2)}`;

    // Find last NDT quotation for this FY
    const lastQuotation = await NdtQuotation.findOne({
      where: { qtn_id: { [Op.like]: `%${financialYear}/NDT-%` } },
      order: [["created_at", "DESC"]],
    });

    // Generate next number NDT-0001
    let nextNumber = 1;
    if (lastQuotation && lastQuotation.qtn_id) {
      const match = lastQuotation.qtn_id.match(/NDT-(\d+)$/);
      if (match) nextNumber = Number(match[1]) + 1;
    }

    const paddedNumber = String(nextNumber).padStart(4, "0");

    // REF
    const qtnRef = `KDMEIPL/Quote/${financialYear}/NDT-${paddedNumber}`;

    // File name for S3
    const fileKey = `KDMEIPL/Quote/${financialYear}/NDT-${paddedNumber}.pdf`;

    // Create PDF
    const pdfDoc = printer.createPdfKitDocument({
      pageMargins: [40, 90, 40, 70],
      header: createHeader,
      footer: (page, count) => createFooter(page, count),
      content: createNdtContent(data, data.contactInfo, qtnRef),
      background: (page, count) => createWaterMark(page, count),
      styles: {
        tableHeader: { fontSize: 10, fillColor: "#eaeaea", bold: true },
      },
    });

    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));

    pdfDoc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);

        // Upload to S3
        const uploadResult = await s3
          .upload({
            Bucket: mtQuotationBusket,
            Key: fileKey,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          })
          .promise();

        // Save DB record
        const dbResponse = await NdtQuotation.create({
          qtn_id: qtnRef,
          location: fileKey,
          created_by: data.contactInfo.name,
          contact: data.contactInfo.mobile,
          email: data.contactInfo.email,
          subtotal: data.subtotal,
          gst: data.gst,
          total: data.total,
          payment_terms: data.paymentTerms,
          conditions: data.conditions,
          screen_data: data,
        });

        return res.status(200).json({
          data: dbResponse,
          fileUrl: uploadResult.Location,
          downloadName: `NDT-${paddedNumber}.pdf`,
        });
      } catch (err) {
        console.error("Error saving NDT quotation:", err);
        return res.status(500).json({ error: "Failed to save NDT quotation" });
      }
    });

    pdfDoc.end();
  } catch (err) {
    console.error("Error creating NDT quotation:", err);
    return res.status(500).json({ error: "Error generating NDT quotation" });
  }
};

module.exports = { createNdtQuotation };

module.exports = { createNdtQuotation };

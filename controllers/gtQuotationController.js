// controllers/gtQuotationController.js
const { GtQuotation } = require("../models");
const PdfPrinter = require("pdfmake");
const path = require("path");
const AWS = require("aws-sdk");
require("dotenv").config();
const { Op } = require("sequelize");

const { qrScanner, RKsign } = require("../reports/filePaths");
const { createHeader } = require("../reports/header");
const { createFooter } = require("../reports/footer");
const createWaterMark = require("../reports/waterMark");
const { createPANAndBankDetailsTable } = require("../reports/proformaInvoice");

const gtQuotationBucket =
  process.env.GT_QUOTATIONS || process.env.MATERIAL_TESTING_QUOTATIONS;

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

function getCurrentDateTime() {
  const now = new Date();
  return now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 17);
}
function getRowSpan(items, index) {
  let span = 1;
  for (let i = index + 1; i < items.length; i++) {
    if (items[i].isGroupChild) span++;
    else break;
  }
  return span;
}

function getDayWithSuffix(day) {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}
function getFinancialYear() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = Jan, 11 = Dec

  // Financial year starts in April
  if (month >= 3) {
    // April or later
    return `${String(year).slice(2)}-${String(year + 1).slice(2)}`;
  } else {
    // Before April
    return `${String(year - 1).slice(2)}-${String(year).slice(2)}`;
  }
}

async function getNextGtPrefix() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Financial Year Logic
  let startYear, endYear;
  if (month >= 4) {
    startYear = year % 100;
    endYear = (year + 1) % 100;
  } else {
    startYear = (year - 1) % 100;
    endYear = year % 100;
  }

  const fy = `${startYear.toString().padStart(2, "0")}-${endYear
    .toString()
    .padStart(2, "0")}`;

  // Get last GT quotation for same FY
  const latest = await GtQuotation.findOne({
    where: {
      prefix_no: { [Op.like]: `%${fy}%` },
    },
    order: [["created_at", "DESC"]],
  });

  let nextNumber = 1;

  if (latest?.prefix_no) {
    const match = latest.prefix_no.match(/GT-(\d{4})$/);
    if (match) nextNumber = parseInt(match[1]) + 1;
  }

  const serial = nextNumber.toString().padStart(4, "0");

  return `KDMEIPL/Quote/${fy}/GT-${serial}`;
}

const createGtContent = (data, contactInfo, prefixNo) => {
  const { name, mobile, address, email, gstin, employee_name } =
    contactInfo || {};

  const content = [];

  // ================= DATE LOGIC =================
  const discussionDate = data.date || data.valid_until || new Date();
  const dateObj = new Date(discussionDate);

  const getDayWithSuffix = (day) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1:
        return `${day}st`;
      case 2:
        return `${day}nd`;
      case 3:
        return `${day}rd`;
      default:
        return `${day}th`;
    }
  };

  const day = getDayWithSuffix(dateObj.getDate());
  const month = dateObj.toLocaleString("en-GB", { month: "long" });
  const year = dateObj.getFullYear();
  const discussionDateFormatted = `${day} ${month} ${year}`;

  const validUntil = new Date(dateObj);
  validUntil.setDate(validUntil.getDate() + 15);
  const validUntilFormatted = `${getDayWithSuffix(validUntil.getDate())} ${validUntil.toLocaleString("en-GB", { month: "long" })} ${validUntil.getFullYear()}`;

  // ================= HEADER =================
  content.push({
    columns: [
      {
        width: "*",
        stack: [
          { text: `REF: ${prefixNo}`, bold: true, fontSize: 9 },
          { text: "To,", fontSize: 9 },
          { text: address || "", fontSize: 9 },
          mobile ? { text: `Phone: ${mobile}`, fontSize: 9 } : {},
          email ? { text: `Email: ${email}`, fontSize: 9 } : {},
          gstin ? { text: `GSTIN: ${gstin}`, fontSize: 9 } : {},
          { text: `Kind Attn: ${employee_name || ""}`, fontSize: 9 },
        ],
      },
      {
        width: 120,
        text: `Date: ${discussionDateFormatted}`,
        alignment: "right",
        fontSize: 9,
      },
    ],
  });

  content.push({
    text: "QUOTATION",
    alignment: "center",
    fontSize: 11,
    bold: true,
    margin: [0, 5, 0, 5],
  });
  content.push({ text: "Dear Sir", alignment: "left", fontSize: 10 });
  if (data.sub) {
    content.push({ text: `Sub: ${data.sub}`, fontSize: 9 });
  }

  const referenceText = data.refText
    ? `Ref: ${data.refText} (${discussionDateFormatted})`
    : `Ref: Oral Discussion held on (${discussionDateFormatted})`;

  content.push({ text: referenceText, fontSize: 9 });

  // ================= TABLE HEADER =================
  const tableBody = [
    [
      { text: "Sl. No", style: "tableHeader" },
      { text: "Description", style: "tableHeader" },
      { text: "Unit", style: "tableHeader" },
      { text: "Qty", style: "tableHeader" },
      { text: "Rate", style: "tableHeader" },
      { text: "Amount", style: "tableHeader" },
    ],
  ];

  // ================= HELPER =================
  function getRowSpan(items, index) {
    let span = 1;
    for (let i = index + 1; i < items.length; i++) {
      if (items[i].isGroupChild) span++;
      else break;
    }
    return span;
  }

  let serialNo = 1;

  // ================= SOIL / ROCK SPECIAL SECTIONS =================
  (data.items || []).forEach((item, i) => {
    // Soil Sub Items
    if (item.subItems?.length) {
      tableBody.push([
        { text: `${serialNo++}`, fontSize: 9 },
        { text: "Soil Sample Testing", bold: true, fontSize: 9 },
        "",
        "",
        "",
        "",
      ]);

      item.subItems.forEach((sub, idx) => {
        const amount = Number(sub.qty || 0) * Number(sub.rate || 0);
        tableBody.push([
          { text: "", fontSize: 9 },
          { text: `   ${idx + 1}) ${sub.name}`, fontSize: 9 },
          { text: sub.unit || "-", fontSize: 9 },
          { text: sub.qty || 1, fontSize: 9 },
          { text: sub.rate || 0, fontSize: 9 },
          { text: amount.toFixed(2), fontSize: 9 },
        ]);
      });
    }

    // Rock Cells
    if (item.rockCells?.length) {
      tableBody.push([
        { text: `${serialNo++}`, fontSize: 9 },
        { text: "Drilling Extra Depth (Rock)", bold: true, fontSize: 9 },
        "",
        "",
        "",
        "",
      ]);

      item.rockCells.forEach((cell, idx) => {
        const amount = Number(cell.qty || 0) * Number(cell.rate || 0);
        tableBody.push([
          { text: "", fontSize: 9 },
          { text: `   ${idx + 1}) ${cell.description}`, fontSize: 9 },
          { text: cell.unit || "-", fontSize: 9 },
          { text: cell.qty || 1, fontSize: 9 },
          { text: cell.rate || 0, fontSize: 9 },
          { text: amount.toFixed(2), fontSize: 9 },
        ]);
      });
    }
  });

  // ================= MERGED NORMAL ITEMS =================
  (data.items || []).forEach((item, i) => {
    if (item.isGroupChild) return;
    if (item.subItems || item.rockCells) return;

    const rowSpan = item.isGroupParent ? getRowSpan(data.items, i) : 1;
    const amount = Number(item.qty || 0) * Number(item.rate || 0);

    // Parent Row
    tableBody.push([
      { text: serialNo++, fontSize: 9 },
      { text: item.description || "-", fontSize: 9 },

      item.isGroupParent
        ? {
            text: item.unit || "-",
            rowSpan,
            fontSize: 9,
            alignment: "center",
            margin: [0, 6, 0, 6],
          }
        : { text: item.unit || "-" },

      item.isGroupParent
        ? {
            text: item.qty || "",
            rowSpan,
            alignment: "center",
            fontSize: 9,
            margin: [0, 6, 0, 6],
          }
        : { text: item.qty || "" },

      item.isGroupParent
        ? {
            text: item.rate || "",
            rowSpan,
            alignment: "center",
            fontSize: 9,
            margin: [0, 6, 0, 6],
          }
        : { text: item.rate || "" },

      item.isGroupParent
        ? {
            text: amount.toFixed(2),
            rowSpan,
            alignment: "center",
            fontSize: 9,
            margin: [0, 6, 0, 6],
          }
        : { text: amount.toFixed(2) },
    ]);

    // Child Rows
    if (item.isGroupParent) {
      for (let j = 1; j < rowSpan; j++) {
        const child = data.items[i + j];
        tableBody.push([
          { text: serialNo++, fontSize: 9 },
          { text: child.description || "-", fontSize: 9 },
          {},
          {},
          {},
          {},
        ]);
      }
    }
  });

  // ================= ADD TABLE =================
  content.push({
    table: {
      headerRows: 1,
      widths: ["auto", "*", "auto", "auto", "auto", "auto"],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingTop: () => 2,
      paddingBottom: () => 2,
    },
    margin: [0, 10, 0, 10],
  });

  // ================= FOOTER NOTES =================
  content.push({
    text: "18% GST shall be paid extra over above quoted price.",
    italics: true,
    fontSize: 9,
  });

  // ================= NOTE =================
  content.push({
    text: "Note: Work Shall Commence Only After the PO is Issued.",
    color: "red",
    bold: true,
    fontSize: 10,
    margin: [0, 6, 0, 6],
  });

  // ================= PAYMENT TERMS =================

  // Backend default terms
  const defaultPaymentTerms = [
    "An advance of 25% of Work Value shall be paid along with the work order.",
    "Balance amount to be paid prior to the receipt of the report.",
  ];

  // Use frontend terms if available else default
  const allPaymentTerms =
    Array.isArray(data.paymentTerms) && data.paymentTerms.length > 0
      ? data.paymentTerms
      : defaultPaymentTerms;

  // Print Payment Terms
  content.push({
    text: "Payment Terms:",
    bold: true,
    fontSize: 10,
    margin: [0, 6, 0, 4],
  });

  allPaymentTerms.forEach((term, i) => {
    content.push({
      text: `${i + 1}) ${term}`,
      fontSize: 9,
      margin: [8, 2, 0, 0],
    });
  });

  // ================= OTHER CONDITIONS =================

  // Backend default conditions
  const defaultConditions = [
    "Site Clearance along with statutory permits for drilling shall be done by the client.",
    "Water for drilling of bore holes is in your scope. In case of not provided, above mentioned price will be charged extra.",
    "Location of borehole point should be given by client.",
    "Safety, Security, Power supply, space for drilling team’s tent and Barricading shall be provided by the client.",
    "Payments shall be made for the actual quantities executed at the site.",
    "Approach to all the bore holes is the responsibility of the client at their own cost.",
    "If any technical difficulty arises in the core drilling of bore holes, the payment has to be made to the depth reached and bore hole shall be abandoned at the depth of difficulty.",
    "It will be the responsibility of Intender to solve local problems arises during the course of work.",
  ];

  // Use frontend conditions if available else default
  const allConditions =
    Array.isArray(data.conditions) && data.conditions.length > 0
      ? data.conditions
      : defaultConditions;

  // Print Conditions
  content.push({
    text: "Other Conditions:",
    bold: true,
    fontSize: 10,
    margin: [0, 6, 0, 4],
  });

  allConditions.forEach((cond, i) => {
    content.push({
      text: `${i + 1}) ${cond}`,
      fontSize: 9,
      margin: [8, 2, 0, 0],
    });
  });

  // ================= FINAL PARAGRAPH =================
  content.push({
    text: "The above detailed rates inclusive of men and material, hire charges of equipment. Expecting our offer meets with your requirements and we are waiting for your favourable reply in this regard. For further information or clarification please do contact us. We would like to take this opportunity for thanking your company, for inviting us to send our competitive proposal for your project.",
    fontSize: 9,
    margin: [0, 10, 0, 10],
    alignment: "justify",
  });
  content.push({
    text: `This Quote is valid until the Closing Hours of Business on ${validUntilFormatted}`,
    color: "red",
    bold: true,
    fontSize: 10,
    alignment: "center",
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
const createOrUpdateGtQuotation = async (req, res) => {
  try {
    console.log("🟢 Incoming GT Quotation Request Body:");
    console.log(JSON.stringify(req.body, null, 2));

    const rawData = req.body.data?.data || req.body.data || {};
    const contactInfo = rawData.contactInfo || {};
    const qtnId = rawData.qtn_id;
    // 🧮 Calculate totals based on items
    function calculateGtTotals(data) {
      let subtotal = 0;
      let discount = Number(data.discount || 0);
      let transportation = Number(data.transportation_fee || 0);

      (data.items || []).forEach((item) => {
        // ❌ Skip merged description-only rows
        if (item.isGroupChild) return;

        // Parent normal row
        if (!item.subItems && !item.rockCells) {
          const qty = Number(item.qty || 0);
          const rate = Number(item.rate || 0);
          subtotal += qty * rate;
        }

        // Soil sub items
        (item.subItems || []).forEach((sub) => {
          const qty = Number(sub.qty || 0);
          const rate = Number(sub.rate || 0);
          subtotal += qty * rate;
        });

        // Rock cells
        (item.rockCells || []).forEach((cell) => {
          const qty = Number(cell.qty || 0);
          const rate = Number(cell.rate || 0);
          subtotal += qty * rate;
        });
      });

      const gst = subtotal * 0.18;
      const discountedSubtotal = subtotal - discount;
      const total = discountedSubtotal + gst + transportation;

      return {
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        gst: Number(gst.toFixed(2)),
        transportation_fee: Number(transportation.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    }

    const totals = calculateGtTotals(rawData);

    // ✅ Check if updating
    const isEdit = Boolean(qtnId);
    let prefixNo = rawData.prefix_no;

    // Get prefix only if new
    if (!isEdit) prefixNo = await getNextGtPrefix();

    const date = getCurrentDateTime();

    // 🧾 Generate PDF content
    const docDef = {
      pageMargins: [40, 75, 20, 50],
      header: createHeader,
      footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
      content: createGtContent(rawData, contactInfo, prefixNo),
      background: (currentPage, pageCount) =>
        createWaterMark(currentPage, pageCount),
      defaultStyle: {
        fontSize: 9,
      },
      styles: {
        tableHeader: { fontSize: 10, fillColor: "#eaeaea", bold: true },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDef);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));

    pdfDoc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const cleanPrefix = prefixNo.replace(/\//g, "-");
        const fileName = `${prefixNo}.pdf`; // KEEP ORIGINAL FORMAT

        const uploadResult = await s3
          .upload({
            Bucket: gtQuotationBucket,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: "application/pdf",
          })
          .promise();

        console.log(
          `${isEdit ? "🟡 Updating" : "✅ Creating"} GT quotation PDF:`,
          uploadResult.Location,
        );

        if (isEdit) {
          // 🔄 Update existing record
          const existing = await GtQuotation.findOne({
            where: { qtn_id: qtnId },
          });

          if (!existing)
            return res.status(404).json({ message: "GT Quotation not found" });

          await existing.update({
            location: fileName,
            created_by: contactInfo.name || existing.created_by,
            contact: contactInfo.mobile || existing.contact,
            email: contactInfo.email || existing.email,
            screen_data: rawData,
            prefix_no: prefixNo,
          });

          return res.status(200).json({
            message: "GT Quotation updated successfully",
            fileUrl: uploadResult.Location,
            data: existing,
          });
        } else {
          // 🆕 Create new record
          const dbResponse = await GtQuotation.create({
            location: fileName,
            created_by: contactInfo.name || "Unknown Client",
            contact: contactInfo.mobile || "",
            email: contactInfo.email || "",
            screen_data: rawData,
            prefix_no: prefixNo,
            subtotal: totals.subtotal,
            gst: totals.gst,
            total: totals.total,
            discount: totals.discount,
            transportation_fee: totals.transportation_fee,
            payment_terms: rawData.paymentTerms || [],
            conditions: rawData.conditions || [],
          });

          return res.status(200).json({
            message: "GT Quotation created successfully",
            fileUrl: uploadResult.Location,
            data: dbResponse,
          });
        }
      } catch (err) {
        console.error("❌ Error saving GT quotation:", err);
        res.status(500).json({ error: "Failed to save GT quotation" });
      }
    });

    pdfDoc.end();
  } catch (err) {
    console.error("❌ Error generating GT quotation:", err);
    res.status(500).json({ error: "Error generating GT quotation" });
  }
};

const getGTquotationsController = async (req, res) => {
  try {
    const quotations = await GtQuotation.findAll({
      order: [["created_at", "DESC"]],
      attributes: [
        "qtn_id",
        "location",
        "created_by",
        "contact",
        "email",
        "prefix_no",
        "created_at",
        "screen_data", // include this
      ],
    });
    res.status(200).json({ data: quotations });
  } catch (error) {
    console.error("Error fetching GT Quotations:", error);
    res.status(500).json({ message: "Failed to fetch GT Quotations" });
  }
};
const updateGtQuotation = async (req, res) => {
  try {
    const { id, updateData } = req.body;

    const existing = await GtQuotation.findOne({ where: { qtn_id: id } });
    if (!existing)
      return res.status(404).json({ message: "GT Quotation not found" });

    await existing.update({
      location: fileName,
      created_by: contactInfo.name || existing.created_by,
      contact: contactInfo.mobile || existing.contact,
      email: contactInfo.email || existing.email,
      screen_data: rawData,
      prefix_no: prefixNo,
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      discount: totals.discount,
      transportation_fee: totals.transportation_fee,
      payment_terms: rawData.paymentTerms || existing.payment_terms,
      conditions: rawData.conditions || existing.conditions,
    });

    return res
      .status(200)
      .json({ message: "GT Quotation updated successfully", data: existing });
  } catch (error) {
    console.error("Error updating GT quotation:", error);
    res.status(500).json({ error: "Failed to update GT quotation" });
  }
};

// ❌ Delete GT Quotation
const deleteGtQuotation = async (req, res) => {
  try {
    const { id } = req.body;

    const deleted = await GtQuotation.destroy({ where: { qtn_id: id } });

    if (!deleted)
      return res.status(404).json({ message: "GT Quotation not found" });

    return res
      .status(200)
      .json({ message: "GT Quotation deleted successfully" });
  } catch (error) {
    console.error("Error deleting GT quotation:", error);
    res.status(500).json({ error: "Failed to delete GT quotation" });
  }
};

module.exports = {
  createGtQuotation: createOrUpdateGtQuotation,
  getGTquotationsController,
  updateGtQuotation,
  deleteGtQuotation,
};

// controllers/purchaseOrderController.js
const PdfPrinter = require("pdfmake");
const path = require("path");
const AWS = require("aws-sdk");
const db = require("../models");
const { createFooter } = require("../reports/footer");
const { qrScanner, RKsign } = require("../reports/filePaths");
const PurchaseOrder = db.PurchaseOrder;
const numberToWords = require("number-to-words");
const { createHeader } = require("../reports/header"); // adjust path if needed
const VendorLedger = db.VendorLedger;
const Vendor = db.Vendor;

// ✅ Font setup
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Open/OpenSans-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Open/OpenSans-Bold.ttf"),
    italics: path.join(__dirname, "../fonts/Open/OpenSans-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/PlayfairDisplay-Bold.ttf"),
  },
};
const printer = new PdfPrinter(fonts);
// --- Branch Information ---
const BRANCH_DETAILS = {
  HYD: {
    billing_address: `KDM ENGINEERS (INDIA) PVT LTD.
 PLOT NO.401,SRI RAMANACOLONY,KHARMANGHAT,
 SAROORNAGAR MANDAL,HYDERABAD-500079
 GST NO : 36AAECK9447L1ZX
 PAN NO : AAECK9447L`,

    shipping_address: `KDM ENGINEERS (INDIA) PVT LTD.
Pardha's Picasa, 9th Floor, D Block, Above Vijetha Super Market, Kavuri Hills, Madhapur, Hyderabad-500081
GST NO : 36AAECK9447L1ZX
PAN NO : AAECK9447L`,
    contact_person: "K Srinivasulu",
    mail: "lab.hyd@kdmengineers.com",
    our_gst: "36AAECK9447L1Z2",
  },

  VIZ: {
    billing_address: `KDM ENGINEERS (INDIA) PVT LTD.
Plot No.93, Survey No:29 & 34, E-Block,Autonagar, Visakhapatnam – 530012, Andhra Pradesh
GST NO : 37AAECK9447L2ZU
PAN NO : AAECK9447L`,
    shipping_address: `KDM ENGINEERS (INDIA) PVT LTD.
Plot No.93, Survey No:29 & 34, E-Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh
GST NO : 37AAECK9447L2ZU
PAN NO : AAECK9447L`,
    contact_person: "M. Ramakrishna",
    mail: "accounts.vizag@kdmengineers.com & mrk@kdmengineers.com",
    our_gst: "37AAECK9447L2ZU",
  },
};

// ✅ AWS S3 Config
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

// Format date as DD-MM-YYYY
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
async function generatePoNumber(location, department) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Count existing POs for this location/department/month/year
  const count = await PurchaseOrder.count({
    where: {
      po_number: {
        [db.Sequelize.Op.like]: `KDMEIPL/${location}/${department}/${year}/%`,
      },
    },
  });

  const autoNumber = count + 1;
  return `KDMEIPL/${location}/${department}/${year}/${autoNumber}`;
}

// reports/footer.js
const createFooter753 = (currentPage, pageCount, branchKey = "VIZ") => {
  const FOOTER_DETAILS = {
    VIZ: {
      address: `Plot No.93, Survey No:29 & 34, E-Block, Autonagar, Visakhapatnam – 530012, Andhra Pradesh`,
      contact: `E-mail: mrk@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9912944495`,
    },
    HYD: {
      address: `Plot No.401, Sri Ramana Colony, Kharmanghat, Saroornagar Mandal, Hyderabad - 500079, Telangana`,
      contact: `E-mail: lab.hyd@kdmengineers.com    Website: www.kdmengineers.com    Contact: +91 9908944495`,
    },
  };

  const branchFooter =
    FOOTER_DETAILS[branchKey?.toUpperCase()] || FOOTER_DETAILS.VIZ;

  return {
    stack: [
      {
        canvas: [
          { text: "" },
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
        margin: [0, 0, 0, 4],
      },
      {
        text: `${branchFooter.address}\n${branchFooter.contact}`,
        fontSize: 9,
        alignment: "center",
        bold: true,
      },
      {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "right",
        fontSize: 8.5,
        margin: [0, 0, 20, 0],
      },
    ],
  };
};
// ✅ GST STATE CODE MAP
const COMPANY_GST_BY_LOCATION = {
  HYD: "36", // Telangana
  VIZ: "37", // Andhra Pradesh
};
const getPaidAmountForPO = async (po_id) => {
  const result = await db.PoDocument.sum("amount", {
    where: {
      po_id,
      doc_type: "TI", // Tax Invoice
    },
  });

  return Number(result || 0);
};

// --- CREATE PURCHASE ORDER ---
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      project_code,
      remarks,

      vendor_name,
      vendor_id,
      vendor_address,
      billing_address,
      shipping_address,
      contact,
      po_date,
      email,
      gst,
      quotation_no,
      items: itemsArray,
      terms,
      warranty,
      quotation_date,
      delivery_period,
      payment_terms,
      employee_name,
      tax_type,
      extra_rows,
      location, // from frontend select (Viz/Hyd)
      department,
    } = req.body;

    console.log(vendor_id, "vendor_id768");
    console.log(req.body, "body786");

    const branch =
      BRANCH_DETAILS[location?.toUpperCase()] || BRANCH_DETAILS.VIZ; // fallback to VIZ if undefined

    const po_number = await generatePoNumber(location, department);

    // Parse items if sent as string
    let items = [];
    if (typeof itemsArray === "string") {
      try {
        items = JSON.parse(itemsArray);
      } catch (err) {
        items = [];
      }
    } else if (Array.isArray(itemsArray)) {
      items = itemsArray;
    }

    // File attachment upload to S3
    let attachment_urls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `PO-Quotation-${po_number}-${Date.now()}${path.extname(
          file.originalname,
        )}`;

        const uploadParams = {
          Bucket: process.env.PO_BUCKET,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadResult = await s3.upload(uploadParams).promise();
        attachment_urls.push(uploadResult.Location);
      }
    }

    // Recalculate items safely
    const recalculatedItems = (items || []).map((it) => {
      const name = it?.name || "-";
      // const hsn = it?.hsn || "";
      const hsn = it?.hsn?.trim() || "";
      const qty = Number(it?.qty) || 0;
      const rate = Number(it?.rate) || 0;
      const discount = Number(it?.discount) || 0;
      const amount = qty * rate - discount;
      return { name, hsn, qty, rate, discount, amount };
    });

    const hasDiscount = recalculatedItems.some((it) => it.discount > 0);
    const subtotal = recalculatedItems.reduce((s, it) => s + it.amount, 0);
    const hasHSN = recalculatedItems.some(
      (it) => it.hsn && it.hsn.trim() !== "",
    );

    // Tax calculation
    let taxRows = [];
    let grandTotal = subtotal;

    // Company GST based on location
    const companyStateCode =
      COMPANY_GST_BY_LOCATION[location?.toUpperCase()] || null;
    const vendorStateCode = gst && gst.length >= 2 ? gst.substring(0, 2) : null;

    if (vendorStateCode && companyStateCode) {
      if (vendorStateCode === companyStateCode) {
        // ✅ SAME STATE → CGST + SGST
        const cgst = subtotal * 0.09;
        const sgst = subtotal * 0.09;

        taxRows.push(["CGST @9%", cgst.toFixed(2)]);
        taxRows.push(["SGST @9%", sgst.toFixed(2)]);

        grandTotal = subtotal + cgst + sgst;
      } else {
        // ✅ DIFFERENT STATE → IGST
        const igst = subtotal * 0.18;

        taxRows.push(["IGST @18%", igst.toFixed(2)]);
        grandTotal = subtotal + igst;
      }
    } else {
      // Safety fallback
      grandTotal = subtotal;
    }
    // ✅ Extract Vendor GST State Code (first 2 digits)

    // Ensure no undefined cells
    taxRows = taxRows.map((row) =>
      row.map((cell) => (cell === undefined ? "-" : cell)),
    );

    const grandTotalRounded = Number(grandTotal.toFixed(2));
    const subtotalRounded = Number(subtotal.toFixed(2));
    let extraRowsArray = [];
    if (extra_rows) {
      if (typeof extra_rows === "string") {
        try {
          extraRowsArray = JSON.parse(extra_rows);
        } catch (err) {
          extraRowsArray = [];
        }
      } else if (Array.isArray(extra_rows)) {
        extraRowsArray = extra_rows;
      }
    }

    let pan = "-";
    if (gst) {
      if (gst.toUpperCase() === "NOT REGISTERED") {
        pan = "NOT REGISTERED";
      } else if (gst.length >= 12) {
        // PAN is 4th to 13th character (index 2–11)
        pan = gst.substring(2, 12);
      }
    }

    const docDefinition = {
      pageMargins: [40, 68, 40, 40],
      header: createHeader,
      defaultStyle: { fontSize: 8, lineHeight: 1.2 },
      footer: (currentPage, pageCount) =>
        createFooter753(currentPage, pageCount, location),
      content: [
        // Title
        {
          text: "PURCHASE ORDER",
          style: "title",
          alignment: "center",
          margin: [0, 0, 0, 8],
        },

        // ✅ Enhanced Vendor + PO Details
        {
          table: {
            widths: ["48%", "52%"], // slightly adjusted for balance
            body: [
              // Row 1: Vendor & PO Number
              [
                {
                  text: `VENDOR : ${vendor_name || "-"}`,
                  bold: true,
                  alignment: "left",
                },
                {
                  text: `P.O. No: ${po_number || "-"}`,
                  bold: true,
                  alignment: "left",
                },
              ],

              // Row 2: Vendor Address + GST and PO Date
              [
                {
                  stack: [
                    {
                      text: `Address:\n${vendor_address || "-"}`,
                      bold: true,
                      alignment: "left",
                    },
                    // {
                    //   text: `GST No: ${gst || "-"}`,
                    //   bold: true,
                    //   margin: [0, 3, 0, 0],
                    //   alignment: "left",
                    // },

                    {
                      // ✅ Added PAN display next to GST
                      text: `GST No: ${gst || "-"}\nPAN No: ${pan || "-"}`,
                      bold: true,
                      margin: [0, 3, 0, 0],
                      alignment: "left",
                    },
                  ],
                },
                {
                  text: `PO Date: ${po_date ? formatDate(po_date) : "-"}`,
                  bold: true,
                  alignment: "left",
                },
              ],

              // Row 3: Contact Name + Email & Shipping Address
              [
                {
                  text: `Contact Name: ${employee_name || "-"}\nEmail: ${email || "-"}`,
                  bold: true,
                  alignment: "left",
                },
                {
                  text: `Shipping Address:\n${branch.shipping_address || "-"}`,
                  bold: true,
                  alignment: "left",
                },
              ],

              // Row 4: Quotation No + Date & Billing Address
              [
                {
                  text: `Quotation No: ${quotation_no || "-"}\nQuotation Date: ${
                    quotation_date ? formatDate(quotation_date) : "-"
                  }`,
                  bold: true,
                  alignment: "left",
                },
                {
                  text: `Billing Address:\n${branch.billing_address || "-"}`,
                  bold: true,
                  alignment: "left",
                },
              ],

              // Row 5: Contact No & Contact Person + Mail
              [
                {
                  text: `Contact No : ${contact || "-"}`,
                  bold: true,
                  alignment: "left",
                },
                {
                  text: `Contact Person: ${branch.contact_person || "-"}\nMails: ${branch.mail || "-"}`,
                  bold: true,
                  alignment: "left",
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3,
          },
          margin: [0, 0, 0, 8],
        },

        // Subject
        {
          table: {
            widths: ["100%"],
            body: [[{ text: `Subject: ${terms || "-"}`, bold: true }]],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 8],
        },

        // Items Table
        // Items Table
        {
          table: {
            headerRows: 1,

            // ✅ Dynamically decide column structure based on HSN & Discount presence
            widths:
              hasDiscount && hasHSN
                ? ["auto", "*", "auto", "auto", "auto", "auto", "auto"] // with HSN & discount
                : hasDiscount && !hasHSN
                  ? ["auto", "*", "auto", "auto", "auto", "auto"] // no HSN but with discount
                  : !hasDiscount && hasHSN
                    ? ["auto", "*", "auto", "auto", "auto", "auto"] // HSN but no discount
                    : ["auto", "*", "auto", "auto", "auto"], // no HSN & no discount

            body: (() => {
              const headers = [];

              // ✅ Build header dynamically
              headers.push({ text: "S.N", style: "tableHeader" });
              headers.push({ text: "Item Description", style: "tableHeader" });
              if (hasHSN) headers.push({ text: "HSN", style: "tableHeader" });
              headers.push({ text: "Qty", style: "tableHeader" });
              headers.push({ text: "Unit Cost", style: "tableHeader" });
              if (hasDiscount)
                headers.push({ text: "Discount", style: "tableHeader" });
              headers.push({ text: "Total Cost", style: "tableHeader" });

              // ✅ Build item rows dynamically
              const rows = recalculatedItems.map((it, i) => {
                const row = [];
                row.push({ text: i + 1, alignment: "center" });
                row.push({ text: it.name || "", fontSize: 9 });
                if (hasHSN)
                  row.push({ text: it.hsn || "", alignment: "center" });
                row.push({ text: it.qty.toString(), alignment: "center" });
                row.push({ text: it.rate.toFixed(2), alignment: "right" });
                if (hasDiscount)
                  row.push({
                    text: it.discount != null ? it.discount.toFixed(2) : "0.00",
                    alignment: "right",
                  });
                row.push({ text: it.amount.toFixed(2), alignment: "right" });
                return row;
              });

              return [headers, ...rows];
            })(),
          },

          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
          margin: [0, 0, 0, 8],
          dontBreakRows: true,
        },

        // Totals Table
        {
          table: {
            widths: ["*", "auto"],
            body: [
              ["Total", subtotalRounded.toFixed(2)],
              ...taxRows,
              [
                { text: "Grand Total", bold: true },
                { text: grandTotalRounded.toFixed(2), bold: true },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
          margin: [0, 0, 0, 8],
        },

        // Amount in Words
        {
          table: {
            widths: ["100%"],
            body: [
              [
                {
                  text: `In Words: ${numberToWords.toWords(Math.round(grandTotalRounded))} rupees only`,
                  italics: true,
                  bold: true,
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
          margin: [0, 0, 0, 8],
        },

        // Terms & Conditions + Extra Rows
        {
          table: {
            widths: ["30%", "70%"],
            body: (() => {
              const termsTableBody = [
                [{ text: "Terms & Conditions :", bold: true }, {}],
                [{ text: "Payment Terms", bold: true }, payment_terms || "-"],
                [
                  { text: "Delivery Period", bold: true },
                  delivery_period || "-",
                ],
                [{ text: "Warranty", bold: true }, warranty || "-"],
              ];

              extraRowsArray.forEach((row) => {
                termsTableBody.push([
                  { text: row.label || "-", bold: true },
                  row.value || "-",
                ]);
              });

              return termsTableBody;
            })(),
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
          margin: [0, 0, 0, 8],
        },

        // Signatures
        {
          table: {
            widths: ["50%", "50%"],
            body: [
              [
                {
                  stack: [
                    {
                      text: "KDM ENGINEERS (INDIA) PVT. LTD.",
                      alignment: "center",
                      bold: true,
                      // margin: [0, 6, 0, 2],
                    },
                    {
                      image: RKsign,
                      width: 80, // smaller sign image
                      height: 30, // reduced height
                      // margin: [0, 4, 0, 2],
                      alignment: "center",
                    },
                    {
                      text: "Authorized Signatory",
                      alignment: "center",
                      bold: true,
                      // margin: [0, 2, 0, 0],
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: `${vendor_name}`,
                      alignment: "center",
                      bold: true,
                      // margin: [0, 6, 0, 2],
                    },
                    {
                      text: "Authorized Signatory",
                      alignment: "center",
                      bold: true,
                      margin: [0, 30, 0, 0], // reduced bottom space
                    },
                  ],
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#000",
            vLineColor: () => "#000",
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 3,
            paddingBottom: () => 3,
          },
          margin: [0, 5, 0, 0], // reduced outer margin
        },
      ],

      styles: {
        title: { fontSize: 14, bold: true, decoration: "underline" },
        tableHeader: { bold: true },
      },
    };

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName = `PO-${po_number}.pdf`;

      const uploadParams = {
        Bucket: process.env.PO_BUCKET,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      };
      const uploadResult = await s3.upload(uploadParams).promise();

      const [po, created] = await PurchaseOrder.findOrCreate({
        where: { po_number },
        defaults: {
          vendor_id,
          project_code,
          department,
          location,
          remarks,
          vendor_name,
          vendor_address,
          billing_address,
          shipping_address,
          contact,
          email,
          gst,
          quotation_no,
          items: recalculatedItems,
          total_amount: grandTotalRounded,
          terms,
          warranty,
          delivery_period,
          payment_terms,
          employee_name,
          tax_type,
          file_url: uploadResult.Location,
          // attachment_url,
          attachment_urls: attachment_urls,

          extra_rows: extraRowsArray,

          // attachment_url: attachment_url || uploadResult.Location,
        },
      });
      // console.log(recalculatedItems,'recalculatedItems765')
      // await VendorLedger.create({
      //   vendor_id: vendor_id,
      //   po_date: po_date,
      //   bill_data: recalculatedItems,
      // });
      // console.log(created,'created234')
      if (!created) {
        await po.update({
          vendor_id,
          project_code,
          department,
          location,
          remarks,
          vendor_name,
          vendor_address,
          billing_address,
          shipping_address,
          contact,
          email,
          gst,
          quotation_no,
          items: recalculatedItems,
          total_amount: grandTotalRounded,
          terms,
          warranty,
          delivery_period,
          payment_terms,
          employee_name,
          tax_type,
          file_url: uploadResult.Location,
          attachment_urls: attachment_urls.length
            ? attachment_urls
            : po.attachment_urls,

          extra_rows: extra_rows || [],

          // attachment_url: attachment_url || uploadResult.Location,
        });
      }

      res.status(201).json(po);
    });

    pdfDoc.end();
  } catch (err) {
    console.error("Error creating PO:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- GET ALL ---
// --- GET ALL PURCHASE ORDERS WITH PAYMENT INFO ---
const getAllPurchaseOrders = async (req, res) => {
  try {
    const orders = await PurchaseOrder.findAll({
      include: [
        {
          model: db.PoDocument,
          as: "documents",
          attributes: ["amount", "doc_type"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // ✅ Calculate paid & remaining amounts
    const ordersWithPayment = orders.map((po) => {
      const paid = (po.documents || [])
        .filter((d) => d.doc_type === "TI")
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

      const total = Number(po.total_amount || 0);

      return {
        ...po.toJSON(),
        paid_amount: paid,
        remaining_amount: total - paid,
      };
    });

    res.json(ordersWithPayment);
  } catch (err) {
    console.error("Fetch PO Error:", err);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
};

// --- DELETE ---
const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await PurchaseOrder.destroy({ where: { po_id: id } });
    if (!deleted) return res.status(404).json({ error: "PO not found" });
    res.json({ message: "PO deleted successfully" });
  } catch (err) {
    console.error("Delete PO Error:", err);
    res.status(500).json({ error: "Failed to delete PO" });
  }
};

module.exports = {
  createPurchaseOrder,
  getAllPurchaseOrders,
  deletePurchaseOrder,
};

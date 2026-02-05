const AWS = require("aws-sdk");
const db = require("../models");
const WoDocument = db.WoDocument;
// const VendorLedger = db.VendorLedger;
// const { VendorLedger } = require("../models/VenderLedger");
const { VendorLedger, Vendor } = require("../models");
const WorkOrder = db.WorkOrder;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// ADD WO DOCUMENT
exports.addWoDocument = async (req, res) => {
  console.log("WO DOCUMENT BODY:", req.body);
  console.log("WO INVOICE NO:", req.body.invoice_no);
  console.log("WO INVOICE NO:", req.body.invoice_no);
  console.log("WO INVOICE NO:", req.body.invoice_no);
  console.log("WO INVOICE NO:", req.body.invoice_no);
  console.log("WO INVOICE NO:", req.body.invoice_no);
  console.log("WO INVOICE NO:", req.body.invoice_no);
  try {
    const { wo_id } = req.params;
    // const { doc_type, doc_date, amount } = req.body;
    const { doc_type, doc_date, amount, vendor_id, invoice_no } = req.body;

    if (!req.files || !req.files.length) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const urls = [];

    for (const file of req.files) {
      const key = `wo-documents/${wo_id}/${doc_type}/${Date.now()}-${file.originalname}`;

      const upload = await s3
        .upload({
          Bucket: process.env.WO_DOCUMENTS_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();

      urls.push(upload.Location);
    }

    // ACK replace logic (same as PO)
    if (doc_type === "ACK") {
      await WoDocument.destroy({ where: { wo_id, doc_type: "ACK" } });
    }

    const record = await WoDocument.create({
      wo_id,
      doc_type,
      doc_date,
      invoice_no: doc_type === "ACK" ? null : invoice_no,
      amount: doc_type === "ACK" ? null : amount,
      file_urls: urls,
    });
    // ✅ CREATE VENDOR LEDGER ROW FOR WO PROFORMA (SAME AS PO)
    // ✅ CREATE VENDOR LEDGER ROW FOR WO PROFORMA (SAME AS PO)

    if (doc_type === "PI") {
      // 1️⃣ Get Work Order
      const wo = await WorkOrder.findByPk(wo_id);

      if (!wo || !wo.contracter_name) {
        throw new Error("Contractor not found in Work Order");
      }

      // 2️⃣ Find Vendor using contractor_name
      // const vendor = await Vendor.findOne({
      //   where: {
      //     vendor_name: wo.contracter_name.trim(),
      //   },
      // });
      if (!wo.vendor_id) {
        throw new Error("Vendor not linked to Work Order");
      }

      const vendor = await Vendor.findByPk(wo.vendor_id);

      if (!vendor) {
        throw new Error("Vendor not linked to Work Order");
      }

      // 3️⃣ Create Vendor Ledger (SAME BEHAVIOUR AS PO)
      await VendorLedger.create({
        vendor_id: vendor.id,
        ref_type: "WO",
        ref_id: String(wo_id),
        doc_type: "PI", // 🔥 REQUIRED
        po_date: doc_date,
        invoice_id: invoice_no || null,
        bill_data: {
          ref_type: "WO",
          ref_id: wo_id,
          transactions: [],
          pi_amount: amount,
        },
      });
    }
    if (doc_type === "TI") {
      const wo = await WorkOrder.findByPk(wo_id);
      if (!wo || !wo.vendor_id) {
        throw new Error("WO or vendor not found");
      }

      // 🔥 CREATE A NEW LEDGER ROW (DO NOT TOUCH PI)
      await VendorLedger.create({
        vendor_id: wo.vendor_id,
        ref_type: "WO",
        ref_id: String(wo_id),
        doc_type: "TI",
        po_date: doc_date,
        invoice_id: invoice_no || null,
        bill_data: {
          ti_amount: Number(amount) || 0,
          ref_type: "WO",
          ref_id: String(wo_id),
          transactions: [],
        },
      });
    }

    return res.json(record);
  } catch (err) {
    console.error("WO document upload error:", err);
    return res.status(500).json({ error: "Failed to upload WO document" });
  }
};

// VIEW WO DOCUMENTS
exports.getWoDocuments = async (req, res) => {
  try {
    const { wo_id, type } = req.params;

    const docs = await WoDocument.findAll({
      where: { wo_id, doc_type: type },
      order: [["created_at", "DESC"]],
    });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch WO documents" });
  }
};

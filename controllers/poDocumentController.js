const path = require("path");
const AWS = require("aws-sdk");
const db = require("../models");

const PoDocument = db.PoDocument;
const { VendorLedger, PurchaseOrder } = db;

// AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * ADD PI / TI / ACK DOCUMENT
 */
exports.addPoDocument = async (req, res) => {
  console.log("📥 PO DOC API HIT", {
    po_id: req.params.po_id,
    body: req.body,
    filesCount: req.files?.length,
  });

  try {
    const { po_id } = req.params;
    const { doc_type, amount, doc_date, invoice_no } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const urls = [];

    for (const file of req.files) {
      const folderPath = `po-documents/${po_id}/${doc_type}`;

      const key = `${folderPath}/${Date.now()}-${file.originalname}`;

      const upload = await s3
        .upload({
          Bucket: process.env.PO_DOCUMENTS_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
        .promise();

      urls.push(upload.Location);
    }

    // 🔥 FIX: ACK = REMOVE OLD RECORD FIRST
    if (doc_type === "ACK") {
      await PoDocument.destroy({
        where: {
          po_id,
          doc_type: "ACK",
        },
      });
    }

    const record = await PoDocument.create({
      po_id,
      doc_type,
      doc_date,
      amount: doc_type === "ACK" ? null : amount,
      invoice_no: doc_type === "ACK" ? null : invoice_no,
      file_urls: urls,
    });
    console.log("✅ PoDocument created", {
      po_id,
      doc_type,
      amount,
      invoice_no,
    });

    // ✅ AUTO CREATE LEDGER ENTRY FOR PO PI

    // ✅ AUTO CREATE LEDGER ENTRY FOR PO PI
    if (doc_type === "PI") {
      console.log("➡️ PI detected, trying ledger create");
      console.log("➡️ PI detected, trying ledger create");
      const po = await PurchaseOrder.findByPk(po_id);
      console.log("🔍 PO FETCH RESULT", po?.toJSON?.() || po);
      console.log("🔍 PO FETCH RESULT", po?.toJSON?.() || po);

      if (!po || !po.vendor_id) {
        console.warn("PO or vendor_id missing for ledger", { po_id });
      } else {
        await VendorLedger.create({
          vendor_id: po.vendor_id,

          // 🔥 ALWAYS STRING (matches VendorLedger model)
          ref_id: String(po_id),

          ref_type: "PO",
          doc_type: "PI",

          invoice_id: invoice_no || null,
          po_date: doc_date,

          bill_data: {
            pi_amount: Number(amount) || 0,
            ref_type: "PO",
            ref_id: String(po_id),
            transactions: [],
          },
        });
        console.log("✅ VendorLedger CREATED SUCCESSFULLY");
        console.log("✅ VendorLedger CREATED SUCCESSFULLY");
        console.log("✅ VendorLedger CREATED SUCCESSFULLY");
      }
    }
    if (doc_type === "TI") {
      const po = await PurchaseOrder.findByPk(po_id);
      if (!po || !po.vendor_id) {
        throw new Error("PO or vendor not found");
      }

      // 🔥 CREATE A NEW LEDGER ROW (DO NOT TOUCH PI)
      await VendorLedger.create({
        vendor_id: po.vendor_id,
        ref_type: "PO",
        ref_id: String(po_id),
        doc_type: "TI",
        po_date: doc_date,
        invoice_id: invoice_no || null,
        bill_data: {
          ti_amount: Number(amount) || 0,
          ref_type: "PO",
          ref_id: String(po_id),
          transactions: [],
        },
      });
    }

    return res.json(record);
  } catch (err) {
    console.error("Upload PO document error:", err);
    return res.status(500).json({ error: "Failed to upload document" });
  }
};

/**
 * GET PI / TI / ACK DOCUMENTS
 */
exports.getPoDocuments = async (req, res) => {
  try {
    const { po_id, type } = req.params;

    if (!["PI", "TI", "ACK"].includes(type)) {
      return res.status(400).json({ error: "Invalid document type" });
    }

    const docs = await PoDocument.findAll({
      where: { po_id, doc_type: type },
      order: [["created_at", "DESC"]],
    });

    res.json(docs);
  } catch (err) {
    console.error("Fetch PO documents error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

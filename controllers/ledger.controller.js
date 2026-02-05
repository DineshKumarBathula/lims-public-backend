const { Op } = require("sequelize");

const {
  Ledger,
  Orders,
  SampleMaterials,
  sequelize,
  PurchaseOrder,
  PoDocument,
  WoDocument,
  WorkOrder,
  VendorLedger,
} = require("../models/index");
// const PurchaseOrder = require("../models/PurchaseOrder");
// const WorkOrder = require("../models/WorkOrder");

const ledgerService = require("../controllers/services/ledger.service");

// ➕ Add a new ledger entry
exports.addLedgerEntry = async (req, res) => {
  console.log(req.body.data, "data23");

  try {
    const { date, customer_id, entries, job_no, ti, ti_date, id } =
      req.body.data;

    // ✅ Validate required fields
    if (!customer_id || !entries || entries.length === 0) {
      return res.status(400).json({
        message: "customer_id and entries are required",
      });
    }

    // ✅ If ID exists and is valid, perform an UPDATE
    if (id && id !== "-" && id !== "" && id !== undefined && id !== null) {
      const existingLedger = await Ledger.findByPk(id);

      if (!existingLedger) {
        return res.status(404).json({
          message: `Ledger record with id ${id} not found`,
        });
      }

      await existingLedger.update({
        customer_id: customer_id,
        ledger_date: date,
        entries: entries,
        order_number: job_no,
        tax_number: ti,
        tax_converted_date: ti_date,
      });

      return res.status(200).json({
        message: "Ledger entry updated successfully",
        data: existingLedger,
      });
    }

    // ✅ Otherwise, create a new record
    const newLedgerRecord = await Ledger.create({
      customer_id: customer_id,
      ledger_date: date,
      entries: entries,
      order_number: job_no,
      tax_number: ti,
      tax_converted_date: ti_date,
    });

    return res.status(201).json({
      message: "Ledger entry added successfully",
      data: newLedgerRecord,
    });
  } catch (error) {
    console.error("Error adding/updating ledger entry:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getVendorsLedger = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    /* 1️⃣ Vendor Ledger */
    const ledgers = await VendorLedger.findAll({
      where: { vendor_id },
      order: [["po_date", "ASC"]],
      raw: true,
    });

    if (!ledgers.length) return res.json([]);

    /* 2️⃣ Collect IDs */
    const poIds = [
      ...new Set(
        ledgers.filter((l) => l.ref_type === "PO").map((l) => l.ref_id),
      ),
    ];

    const woIds = [
      ...new Set(
        ledgers.filter((l) => l.ref_type === "WO").map((l) => l.ref_id),
      ),
    ];

    /* 3️⃣ Fetch PO numbers (NO include) */
    const purchaseOrders = await PurchaseOrder.findAll({
      where: { po_id: poIds },
      attributes: ["po_id", "po_number"],
      raw: true,
    });

    /* 4️⃣ Fetch WO reference numbers (NO include) */
    const workOrders = await WorkOrder.findAll({
      where: { wo_id: woIds },
      attributes: ["wo_id", "ref_no"],
      raw: true,
    });

    /* 5️⃣ Fetch documents SEPARATELY */
    const poDocs = await PoDocument.findAll({
      where: {
        po_id: poIds,
        doc_type: ["PI", "TI"],
      },
      raw: true,
    });

    const woDocs = await WoDocument.findAll({
      where: {
        wo_id: woIds,
        doc_type: ["PI", "TI"],
      },
      raw: true,
    });

    /* 6️⃣ Maps */
    const poMap = Object.fromEntries(
      purchaseOrders.map((p) => [p.po_id, p.po_number]),
    );
    const woMap = Object.fromEntries(
      workOrders.map((w) => [w.wo_id, w.ref_no]),
    );

    const poDocMap = {};
    poDocs.forEach((d) => {
      if (!poDocMap[d.po_id]) poDocMap[d.po_id] = [];
      poDocMap[d.po_id].push(d);
    });

    const woDocMap = {};
    woDocs.forEach((d) => {
      if (!woDocMap[d.wo_id]) woDocMap[d.wo_id] = [];
      woDocMap[d.wo_id].push(d);
    });

    /* 7️⃣ FINAL RESPONSE */
    /* 7️⃣ FINAL RESPONSE */
    const rows = ledgers
      .filter((l) => ["PI", "TI", "TR"].includes(l.doc_type))
      .map((l) => {
        if (l.doc_type === "TR") {
          return {
            id: l.id,
            doc_type: "TR",
            doc_date: l.po_date,
            ref_no: "-", // payments are not PO/WO specific
            invoice_no: "-",
            amount: null,
            file_urls: [],
            transactions: l.bill_data?.transactions || [],
          };
        }
        const docs =
          l.ref_type === "PO"
            ? poDocMap[l.ref_id] || []
            : woDocMap[l.ref_id] || [];

        // Find exact document for THIS ledger row
        const currentDoc = docs.find(
          (d) =>
            d.doc_type === l.doc_type &&
            String(d.invoice_no) === String(l.invoice_id),
        );

        return {
          id: l.id,
          doc_type: l.doc_type, // ✅ dynamic
          doc_date: l.po_date,
          ref_no: l.ref_type === "PO" ? poMap[l.ref_id] : woMap[l.ref_id],
          invoice_no: l.invoice_id,

          // ✅ Amount logic
          amount:
            l.doc_type === "PI"
              ? l.bill_data?.pi_amount || 0
              : l.bill_data?.ti_amount || 0,

          // ✅ File logic
          file_urls: currentDoc?.file_urls || [],
        };
      });

    return res.status(200).json(rows);
  } catch (err) {
    console.error("Vendor ledger fetch error:", err);
    return res.status(500).json({
      message: "Failed to fetch vendor ledger",
      error: err.message,
    });
  }
};

exports.addVendorLedgerEntry = async (req, res) => {
  try {
    const { data } = req.body;

    const { vendor_id, transaction_date, transactions } = data;

    if (!vendor_id || !transaction_date || !Array.isArray(transactions)) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const ledgerEntry = await VendorLedger.create({
      vendor_id,

      // ✅ VALID ENUM VALUES ONLY
      ref_type: "PO",
      ref_id: 0,
      doc_type: "TR",

      po_date: transaction_date,

      bill_data: {
        transactions,
      },

      invoice_id: "-",
      paid_date: transaction_date,
      mode: transactions[0]?.mode_of_receipt ?? null,
      remarks: transactions[0]?.remarks ?? null,
    });

    return res.status(201).json({ data: ledgerEntry });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// 📜 Fetch all ledgers for a specific order
exports.getOrderLedger = async (req, res) => {
  try {
    const { order_id } = req.params;
    const ledgers = await ledgerService.fetchLedgerByOrder(order_id);
    res.status(200).json(ledgers);
  } catch (error) {
    console.error("Error fetching order ledger:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// 🧾 Fetch ledger summary of all customers
// exports.getCustomerLedgerSummary = async (req, res) => {
//   try {
//     const { customer_id } = req.params;
//     console.log(customer_id, "customer_id76");

//     const summary = await Ledger.findAll({
//       where: { customer_id },
//       order: [["ledger_date", "ASC"]] // optional: sorted by date
//     });

//     console.log(summary,'76f')

//     if (!summary || summary.length === 0) {
//       return res.status(404).json({
//         message: "No ledger records found for this customer"
//       });
//     }

//     console.log(summary,'summary76')

//     return res.status(200).json(summary);

//   } catch (error) {
//     console.error("Error fetching customer ledger summary:", error);
//     res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message
//     });
//   }
// };

exports.getCustomerLedgerSummary = async (req, res) => {
  try {
    const { customer_id } = req.params;

    const summary = await Ledger.findAll({
      where: { customer_id },
      order: [["ledger_date", "ASC"]],
      raw: true, // makes results plain JS objects (no Sequelize instance wrappers)
    });

    if (!summary || summary.length === 0) {
      return res.status(404).json({
        message: "No ledger records found for this customer",
      });
    }

    // ✅ Collect unique order_numbers that are not '-'
    const validOrderNumbers = [
      ...new Set(
        summary.map((s) => s.order_number).filter((n) => n && n !== "-"),
      ),
    ];

    // ✅ Fetch related orders in one query
    const relatedOrders = await Orders.findAll({
      where: {
        order_code: validOrderNumbers,
      },
      attributes: ["order_id", "order_code"],
      raw: true,
    });

    // ✅ Map order_code → order_id
    const orderMap = {};
    relatedOrders.forEach((o) => {
      orderMap[o.order_code] = o.order_id;
    });

    // ✅ Add order_id to summary objects
    const enrichedSummary = summary.map((s) => ({
      ...s,
      order_id: orderMap[s.order_number] || null,
    }));

    return res.status(200).json(enrichedSummary);
  } catch (error) {
    console.error("Error fetching customer ledger summary:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getMonthlyLedgerSummary = async (req, res) => {
  try {
    console.log(req.query, "h89");

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required." });
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    // console.log(startDate,endDate,'b87')
    const summary = await Ledger.findAll({
      where: {
        ledger_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["ledger_date", "ASC"]],
      raw: true,
    });

    // console.log(summary,'summary76')

    if (!summary || summary.length === 0) {
      return res.status(404).json({
        message: `No ledger records found for ${month}/${year}`,
      });
    }

    // ✅ Collect valid order numbers (ignore '-' or null)
    const validOrderNumbers = [
      ...new Set(
        summary.map((s) => s.order_number).filter((n) => n && n !== "-"),
      ),
    ];

    // ✅ Fetch related orders
    const relatedOrders = await Orders.findAll({
      where: {
        order_code: validOrderNumbers,
      },
      attributes: ["order_id", "order_code"],
      raw: true,
    });

    // ✅ Map order_code → order_id
    const orderMap = {};
    relatedOrders.forEach((o) => {
      orderMap[o.order_code] = o.order_id;
    });

    // ✅ Add order_id to summary records
    const enrichedSummary = summary.map((s) => ({
      ...s,
      order_id: orderMap[s.order_number] || null,
    }));

    return res.status(200).json(enrichedSummary);
  } catch (error) {
    console.error("Error fetching customer ledger summary:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getYearlyLedgerSummary = async (req, res) => {
  try {
    // console.log(req.query, "h898");

    let { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year is required." });
    }

    // year = "2025-2026"
    const [fyStart, fyEnd] = year.split("-");

    // Convert to numbers
    const startYear = Number(fyStart);
    const endYear = Number(fyEnd);

    if (!startYear || !endYear) {
      return res
        .status(400)
        .json({ message: "Invalid financial year format." });
    }

    // 🎯 Financial year start = 1 April YYYY
    const startDate = new Date(`${startYear}-04-01`);

    // 🎯 End date = today's date (we fetch till current month)
    const today = new Date();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // console.log("Fetching records between:", startDate, endDate);

    const summary = await Ledger.findAll({
      where: {
        ledger_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["ledger_date", "ASC"]],
      raw: true,
    });

    // console.log(summary, "summary76");

    if (!summary || summary.length === 0) {
      return res.status(404).json({
        message: `No ledger records found for financial year ${year}`,
      });
    }

    // ✅ Collect valid order numbers (ignore '-' or null)
    const validOrderNumbers = [
      ...new Set(
        summary.map((s) => s.order_number).filter((n) => n && n !== "-"),
      ),
    ];

    // ✅ Fetch related orders
    const relatedOrders = await Orders.findAll({
      where: {
        order_code: validOrderNumbers,
      },
      attributes: ["order_id", "order_code"],
      raw: true,
    });

    // ✅ Map order_code → order_id
    const orderMap = {};
    relatedOrders.forEach((o) => {
      orderMap[o.order_code] = o.order_id;
    });

    // ✅ Add order_id to summary records
    const enrichedSummary = summary.map((s) => ({
      ...s,
      order_id: orderMap[s.order_number] || null,
    }));

    return res.status(200).json(enrichedSummary);
  } catch (error) {
    console.error("Error fetching customer ledger summary:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.deleteVendorLedgerById = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    console.log(id, "id345");

    if (!id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Ledger ID is required",
      });
    }

    // 🔍 Find ledger entry
    const ledgerEntry = await VendorLedger.findOne({
      where: { id },
      transaction: t,
    });

    if (!ledgerEntry) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Vendor ledger record not found",
      });
    }

    // 🗑️ Delete record
    await ledgerEntry.destroy({ transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Vendor ledger record deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Delete Vendor Ledger Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete vendor ledger record",
      error: error.message,
    });
  }
};

exports.deleteLedgerById = async (req, res) => {
  const { id } = req.params;
  const { order_number } = req.body;

  const t = await sequelize.transaction();

  try {
    if (order_number && order_number !== "-") {
      const order = await Orders.findOne({
        where: { order_code: order_number },
        transaction: t,
      });
      console.log(order, "o87");
      if (order) {
        const orderId = order.order_id;
        console.log(orderId, "oi987");

        await Orders.update(
          { amount: 0, sample_data: null },
          {
            where: { order_id: orderId },
            transaction: t,
          },
        );
        // Delete SampleMaterials linked to this order
        await SampleMaterials.destroy({
          where: { order_id: orderId },
          transaction: t,
        });
      } else {
        console.log(`⚠️ No order found with order_code: ${order_number}`);
      }
    }

    // Step 1️⃣: Check if the ledger exists
    const existingRecord = await Ledger.findOne({
      where: { id },
      transaction: t,
    });
    if (!existingRecord) {
      await t.rollback();
      return res.status(404).json({ message: "Ledger record not found" });
    }

    // Step 2️⃣: Delete the ledger record itself
    await Ledger.destroy({ where: { id }, transaction: t });

    await t.commit();

    return res.status(200).json({
      message: "Ledger (and related order if any) deleted successfully",
      deletedLedgerId: id,
      deletedOrder: order_number !== "-" ? order_number : null,
    });
  } catch (error) {
    await t.rollback();
    console.error("❌ Error deleting ledger and order:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

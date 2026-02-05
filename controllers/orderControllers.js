const {
  Orders,
  sequelize,
  SampleMaterials,
  SampleParams,
  Product,
  Params,
  Customers,
  Client,
  OrderDraft,
  Notification,
  Jobs,
  Employee,
  ClubTests,
  SampleMaterialFields,
  MaterialTestingQuotation,
  GstRecords,
  Ledger,
  TaxedOrders,
  NdtQuotation,
  GtQuotation,
} = require("../models/index");
const db = require("../models");

// const { Op, fn, col, literal } = require("sequelize");
const {
  uploadWorkOrderFileToS3,
  deleteSampleParamsByOrderId,
  classifySampleParamsAndUpdateDB,
  classifySampleParamsAndUpdateDBwithoutLosingOld,
} = require("./bdControllers");

const { Op, fn, col, where, literal } = require("sequelize");

const { getCustomerInfoUsingID } = require("./customersControllers");
const {
  generateProformaInvoice,
  generateGeotechProformaInvoice,
  generateNdtProformaInvoice,
} = require("../reports/proformaInvoice");

const { v4: uuidv4 } = require("uuid");
const { deleteObjFromBkt } = require("./awsControllers");
const {
  getCustomerByCustomerId,
} = require("../controllers/customersControllers");
const { getIp, createAlog } = require("./LogsController");

const { sendOrderEmail } = require("./mailController");
const { sendWhatsAppMessage } = require("./whatsappController");
const { Json } = require("sequelize/lib/utils");
const { SRC_PATH } = require("../defs/CONST");
const { getsignFile } = require("../defs/customFunctions");

const SequelizeUniqueConstraintError = "SequelizeUniqueConstraintError";
const {
  RajeshwariSign,
  SanyasiRaoSign,
  qrScanner,
  RKsign,
  sagarSign,
  vizagStamp,
} = require("../reports/filePaths");
const Sequelize = require("sequelize");

const generateSampleCodes = (samples, maxNumber, dor) => {
  console.log(samples, maxNumber, dor, "cose781");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstvuwxyz";

  const sampleGroups = samples.reduce((acc, sample) => {
    if (!acc[sample.sampleId]) {
      acc[sample.sampleId] = [];
    }
    acc[sample.sampleId].push(sample);
    6;
    return acc;
  }, {});
  console.log(sampleGroups, "sampleGroups67");
  const [yyyy, mm] = dor.split("-");

  const finalOutput = [];

  Object.keys(sampleGroups).forEach((sampleId, sampleIndex) => {
    const samples = sampleGroups[sampleId];
    samples.forEach((sample, index) => {
      let alphaString = "";
      const alphabeticalSuffix = alphabet[index % alphabet.length];
      if (samples.length >= 2) {
        alphaString = `(${alphabeticalSuffix})`;
      } else {
        alphaString = "";
      }

      const sampleNumber = sampleIndex + 1;

      // Ensure the prefix is present in the sample object
      const prefix = sample.prefix || "AM";

      // Generate the sample_code
      const sample_code = `KDMEIPL/VSKP/${prefix}/${mm}/${yyyy}-${maxNumber}/${sampleNumber}${alphaString}`;

      // Add the sample_code to the sample object
      sample.sample_code = sample_code;

      // Add the sample to the final output array
      finalOutput.push(sample);
    });
  });
  console.log(finalOutput, "finalOutput356");
  return finalOutput;
};

const saveDraftOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { selectedSamples, dor, order_number, reviewChecklist } = req.body;

    await OrderDraft.upsert(
      {
        order_number,
        sample_data: JSON.stringify(selectedSamples),
        dor,
        status: "draft",
        checklist: JSON.stringify(reviewChecklist),
      },
      { transaction: t },
    );

    await t.commit();
    return res
      .status(200)
      .json({ message: "Draft saved or updated", order_number });
  } catch (err) {
    console.error(err);
    await t.rollback();
    return res.status(500).json({ message: "Could not save or update draft" });
  }
};

const getCustomersRevenueDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;

    const monthParam =
      month === undefined || month === "all" ? "all" : Number(month);

    const yearParam =
      year === undefined || year === "all" ? "all" : Number(year);

    // ✅ ADD LOGS HERE
    console.log("🟡 Customers Revenue API called");
    console.log("YEAR PARAM:", yearParam);
    console.log("MONTH PARAM:", monthParam);
    // month can be number or "all"
    console.log(year, "year789");
    // Fetch all customers with orders
    const customers = await Customers.findAll({
      include: [
        {
          model: Orders,
          as: "orders",
          required: false,
          include: [
            {
              model: SampleMaterials,
              as: "samples",
              required: false,
              include: [
                {
                  model: Product,
                  as: "product",
                  attributes: ["id", "name"],
                },

                {
                  model: Jobs,
                  as: "jobs",
                  required: false,
                  attributes: [
                    "job_pk",
                    "job_id",
                    "status",
                    "discipline",
                    "report_approval",
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const responseData = customers.map((customer) => {
      let totalAmount = 0;
      let builtAmount = 0;
      let unbuiltAmount = 0;

      const builtOrders = [];
      const unbuiltOrders = [];

      // Filter orders by selected month/year
      const filteredOrders = customer.orders.filter((order) => {
        const dorRaw = order.dor || order.created_at;
        if (!dorRaw) return false;

        const dor = new Date(
          typeof dorRaw === "string" ? dorRaw.replace(" ", "T") : dorRaw,
        );

        if (isNaN(dor)) return false;

        const matchesYear =
          yearParam === "all" ? true : dor.getFullYear() === yearParam;

        const matchesMonth =
          monthParam === "all" ? true : dor.getMonth() + 1 === monthParam;

        return matchesYear && matchesMonth;
      });

      // Calculate totals based on filtered orders
      filteredOrders.forEach((order) => {
        const orderTotal = order.amount; // only proforma amount

        totalAmount += orderTotal;

        const jobStatusMap = {
          0: "Not Assigned",
          1: "Assigned (Not Submitted)",
          2: "Submitted (Pending Review)",
          3: "Rejected",
          10: "Accepted & Dispatched",
        };

        // console.log(filteredOrders,'sample712')
        const isGT = order.division === "GT";

        const orderInfo = {
          orderno: isGT
            ? order.order_code
            : order.order_number || order.ref || order.order_id,
          dor: order.dor,
          projectName: order.project_name,
          amount: order.amount,
          transportation_fee: order.transportation_fee,
          order_total: orderTotal,
          proformaNum: order.pn,
          branchName: order.branch,
          converted_to_tax: order.converted_to_tax,
          status: order.status, // order status (draft/finalized)
          materialNames: [
            ...new Set(
              (order.samples || [])
                .map((sample) => sample.product?.name)
                .filter(Boolean),
            ),
          ],
          jobs: (order.samples || []).flatMap((sample) =>
            (sample.jobs || []).map((job) => ({
              job_id: job.job_id,
              status: job.status,
              status_label: jobStatusMap[job.status] || "Unknown",
              discipline: job.discipline,
              report_approval: job.report_approval ? true : false,
            })),
          ),
        };

        if (order.converted_to_tax) {
          builtAmount += orderTotal;
          builtOrders.push(orderInfo);
        } else {
          unbuiltAmount += orderTotal;
          unbuiltOrders.push(orderInfo);
        }
      });

      return {
        customer_id: customer.customer_id,
        reporting_name: customer.reporting_name,
        billing_name: customer.billing_name,
        email: customer.email,
        mobile: customer.mobile,
        proforma_total: totalAmount,

        built_total: builtAmount,
        tax_total: builtAmount,
        unbuilt_total: unbuiltAmount,
        built_orders: builtOrders,
        unbuilt_orders: unbuiltOrders,
      };
    });

    // Optionally, remove customers with no orders in this month
    // const finalData = responseData.filter((c) => c.proforma_total > 0);
    const finalData = responseData.filter(
      (c) =>
        c.proforma_total > 0 ||
        (Array.isArray(c.unbuilt_orders) && c.unbuilt_orders.length > 0),
    );

    return res.json({
      success: true,
      count: finalData.length,
      data: finalData,
    });
  } catch (error) {
    console.error("Error in getCustomersRevenueDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getNewCustomers = async (req, res) => {
  try {
    const { year } = req.query;
    console.log(req.query, "query78");

    // **Extract FY start and end dates**
    // year = "2025-2026"
    const [startYear] = year.split("-");
    const fyStart = new Date(`${startYear}-04-01T00:00:00.000Z`);
    const fyEnd = new Date(); // current day

    // Fetch all customers with their orders
    const customers = await Customers.findAll({
      include: [
        {
          model: Orders,
          as: "orders",
          required: false,
          where: {
            dor: {
              [Op.between]: [fyStart, fyEnd],
            },
          },
          include: [
            {
              model: SampleMaterials,
              as: "samples",
              required: false,
              include: [
                {
                  model: Jobs,
                  as: "jobs",
                  required: false,
                  attributes: [
                    "job_pk",
                    "job_id",
                    "status",
                    "discipline",
                    "report_approval",
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const responseData = customers
      .filter((customer) => customer.orders.length === 1) // <-- ONLY 1 ORDER LOGIC
      .map((customer) => {
        let totalAmount = 0;
        let builtAmount = 0;
        let unbuiltAmount = 0;

        const builtOrders = [];
        const unbuiltOrders = [];

        // Customer has only ONE order due to filter above
        const order = customer.orders[0];
        const dor = new Date(order.dor);

        const orderTotal = order.amount || 0;
        totalAmount += orderTotal;

        const jobStatusMap = {
          0: "Not Assigned",
          1: "Assigned (Not Submitted)",
          2: "Submitted (Pending Review)",
          3: "Rejected",
          10: "Accepted & Dispatched",
        };

        const orderInfo = {
          orderno: order.order_number || order.ref || order.order_id,
          dor: order.dor,
          amount: order.amount,
          transportation_fee: order.transportation_fee,
          order_total: orderTotal,
          converted_to_tax: order.converted_to_tax,
          status: order.status,
          jobs: (order.samples || []).flatMap((sample) =>
            (sample.jobs || []).map((job) => ({
              job_id: job.job_id,
              status: job.status,
              status_label: jobStatusMap[job.status] || "Unknown",
              discipline: job.discipline,
              report_approval: job.report_approval ? true : false,
            })),
          ),
        };

        if (order.converted_to_tax) {
          builtAmount += orderTotal;
          builtOrders.push(orderInfo);
        } else {
          unbuiltAmount += orderTotal;
          unbuiltOrders.push(orderInfo);
        }

        return {
          customer_id: customer.customer_id,
          reporting_name: customer.reporting_name,
          billing_name: customer.billing_name,
          email: customer.email,
          mobile: customer.mobile,
          proforma_total: totalAmount,
          built_total: builtAmount,
          tax_total: builtAmount,
          unbuilt_total: unbuiltAmount,
          built_orders: builtOrders,
          unbuilt_orders: unbuiltOrders,
        };
      });

    console.log(responseData.length, "res8923");

    return res.json({
      success: true,
      count: responseData.length,
      data: responseData,
    });
  } catch (error) {
    console.error("Error in getNewCustomers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getMonthlyMaterials = async (req, res) => {
  try {
    let { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    month = Number(month);

    // YEAR FORMAT: "2025-2026"
    const [startYear, endYear] = year.split("-");
    let targetYear = Number(startYear);

    // JAN / FEB / MAR belong to endYear
    if ([1, 2, 3].includes(month)) {
      targetYear = Number(endYear);
    }

    // 👉 Special requirement: December 2025 — fixed window
    const monthStart = `${targetYear}-${String(month).padStart(2, "0")}-01 00:00:00`;

    let lastDay = new Date(targetYear, month, 0).getDate();

    // Detect current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Limit to today
    if (month === currentMonth && targetYear === currentYear) {
      lastDay = now.getDate();
    }

    const monthEnd = `${targetYear}-${String(month).padStart(2, "0")}-${String(
      lastDay,
    ).padStart(2, "0")} 23:59:59`;

    console.log("DATE RANGE:", monthStart, "=>", monthEnd);

    // STEP 1 — Get orders within date range
    const orders = await Orders.findAll({
      where: {
        dor: {
          [Op.between]: [
            Sequelize.literal(`'${monthStart}'`),
            Sequelize.literal(`'${monthEnd}'`),
          ],
        },
        // cancel: { [Op.ne]: 2 },
        cancel: {
          [Op.or]: [{ [Op.is]: null }, 1],
        },
      },
      attributes: ["order_id"],
    });

    if (!orders.length) {
      return res.json({
        success: true,
        total_products: 0,
        data: [],
      });
    }

    const orderIds = orders.map((o) => o.order_id);
    console.log(orderIds, "order8977");
    // STEP 2 — Fetch sample materials using order_ids
    const samples = await SampleMaterials.findAll({
      where: { order_id: orderIds },
      attributes: ["product_id"],
    });

    if (!samples.length) {
      return res.json({
        success: true,
        total_products: 0,
        data: [],
      });
    }

    // STEP 3 — Count product occurrences
    const productQtyMap = {};
    samples.forEach((s) => {
      productQtyMap[s.product_id] = (productQtyMap[s.product_id] || 0) + 1;
    });

    const productIds = Object.keys(productQtyMap);
    console.log(productIds, "productIds87");

    // STEP 4 — Fetch product details
    const products = await Product.findAll({
      where: { id: productIds },
      attributes: ["id", "name"],
    });

    console.log(products, "pro897");

    // STEP 5 — Format output
    const result = products.map((p) => ({
      product_name: p.name,
      total_qty: productQtyMap[p.id] || 0,
    }));

    console.log(result, "result786");

    return res.json({
      success: true,
      total_products: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error in getMonthlyMaterials:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getMonthlyOutstanding = async (req, res) => {
  try {
    let { month, year } = req.query;

    console.log("OUTSTANDING INPUT:", month, year);

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    let dateFilter = {};

    // ================================
    // ✅ YEAR = "all"
    // ================================
    if (year === "all") {
      // Only month filter across all years
      if (month !== "all") {
        month = parseInt(month);

        dateFilter = sequelize.where(
          sequelize.fn("MONTH", sequelize.col("ledger.ledger_date")),
          month,
        );
      }
      // else: month=all & year=all → no date filter
    }

    // ================================
    // ✅ YEAR = specific number
    // ================================
    else {
      year = parseInt(year);

      // MONTH = all → full year
      if (month === "all") {
        const yearStart = new Date(year, 0, 1, 0, 0, 0);
        const yearEnd = new Date(year, 11, 31, 23, 59, 59);

        dateFilter = {
          ledger_date: {
            [Op.between]: [yearStart, yearEnd],
          },
        };
      }

      // MONTH = specific
      else {
        month = parseInt(month);

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        dateFilter = {
          ledger_date: {
            [Op.between]: [startDate, endDate],
          },
        };
      }
    }

    // ================================
    // Fetch customers & ledger
    // ================================
    const customers = await Customers.findAll({
      include: [
        {
          model: Ledger,
          as: "ledger",
          required: false,
          where: dateFilter,
        },
      ],
    });

    // ================================
    // Calculate outstanding
    // ================================
    const result = customers
      .map((cust) => {
        let totalDebit = 0;
        let totalCredit = 0;

        cust.ledger.forEach((lg) => {
          const entries = Array.isArray(lg.entries) ? lg.entries : [];
          entries.forEach((e) => {
            if (e.debit) totalDebit += Number(e.debit);
            if (e.credit) totalCredit += Number(e.credit);
          });
        });

        return {
          customer_id: cust.customer_id,
          billing_name: cust.billing_name,
          mobile: cust.mobile,
          totalDebit,
          totalCredit,
          outstanding: totalDebit - totalCredit,
        };
      })
      .filter((c) => c.outstanding > 0);

    return res.status(200).json({
      success: true,
      month,
      year,
      outstanding_customers: result,
    });
  } catch (error) {
    console.error("Error in getMonthlyOutstanding:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMonthlyReceived = async (req, res) => {
  try {
    let { month, year } = req.query;
    console.log(month, year, "input received");

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "month and year are required",
      });
    }

    let dateFilter = {};

    // -------------------------
    //  YEAR = "all"
    // -------------------------
    if (month !== "all" && year === "all") {
      month = parseInt(month);

      dateFilter = sequelize.where(
        sequelize.fn("MONTH", sequelize.col("ledger.ledger_date")),
        month,
      );
    }

    // -------------------------
    //  MONTH = "all" & YEAR = specific
    // -------------------------
    else if (month === "all" && year !== "all") {
      year = parseInt(year);

      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31, 23, 59, 59);

      dateFilter = {
        ledger_date: {
          [Op.between]: [yearStart, yearEnd],
        },
      };
    }

    // -------------------------
    //  MONTH = specific & YEAR = specific
    // -------------------------
    else if (month !== "all" && year !== "all") {
      year = parseInt(year);
      month = parseInt(month);

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      dateFilter = {
        ledger_date: {
          [Op.between]: [startDate, endDate],
        },
      };
    }

    // --------------------------------------
    // Fetch customers + ledger data
    // --------------------------------------
    const customers = await Customers.findAll({
      include: [
        {
          model: Ledger,
          as: "ledger",
          required: false,
          where: {
            [Op.and]: [
              dateFilter, // ✅ works for both object filters and sequelize.where()

              // Ledger entries with empty / invalid order_number
              {
                [Op.or]: [
                  { order_number: "-" },
                  { order_number: null },
                  { order_number: "" },
                  sequelize.where(
                    sequelize.fn(
                      "LENGTH",
                      sequelize.col("ledger.order_number"),
                    ),
                    "<=",
                    1,
                  ),
                ],
              },
            ],
          },
        },
      ],
    });
    // --------------------------------------
    // Build Final Entries Output
    // --------------------------------------
    let output = [];

    customers.forEach((cust) => {
      cust.ledger.forEach((lg) => {
        const entries = Array.isArray(lg.entries) ? lg.entries : [];

        entries.forEach((e) => {
          output.push({
            billing_name: cust.billing_name,
            customer_id: cust.customer_id,
            ledger_date: lg.ledger_date,
            credit: e.credit || 0,
            mode_of_payment: e.mode_of_payment || "-",
            remarks: e.remarks || "-",
          });
        });
      });
    });

    return res.status(200).json({
      success: true,
      month,
      year,
      received_entries: output,
    });
  } catch (error) {
    console.error("Error in getMonthlyReceived:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMaterialQuotationsDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;

    // -----------------------------------------------------
    // CASE 2: FINANCIAL YEAR (month = "", year = "2025-2026")
    // -----------------------------------------------------
    if (!month && year && year.includes("-")) {
      const [startYear, endYear] = year.split("-").map(Number);

      const startDate = `${startYear}-04-01`;
      const endDate = `${endYear}-03-31`;

      const result = await MaterialTestingQuotation.findAll({
        attributes: [
          [fn("YEAR", col("created_at")), "year"],
          [fn("MONTH", col("created_at")), "month"],
          [fn("COUNT", col("qtn_id")), "count"],
          [fn("SUM", col("total_amount")), "totalAmount"],
        ],
        where: {
          created_at: { [Op.between]: [startDate, endDate] },
        },
        group: [fn("YEAR", col("created_at")), fn("MONTH", col("created_at"))],
        order: [
          [fn("YEAR", col("created_at")), "ASC"],
          [fn("MONTH", col("created_at")), "ASC"],
        ],
        raw: true,
      });

      return res.json({ success: true, data: result });
    }

    // -----------------------------------------------------
    // CASE 1: NORMAL MONTH / YEAR FILTER  ✅ FIXED
    // -----------------------------------------------------
    let whereClause = {};

    // BOTH year & month selected
    if (year && year !== "all" && month && month !== "all") {
      whereClause[Op.and] = [
        where(fn("YEAR", col("created_at")), Number(year)),
        where(fn("MONTH", col("created_at")), Number(month)),
      ];
    }

    // ONLY year selected → all months of that year
    else if (year && year !== "all") {
      whereClause[Op.and] = [
        where(fn("YEAR", col("created_at")), Number(year)),
      ];
    }

    // ONLY month selected → that month across all years
    else if (month && month !== "all") {
      whereClause[Op.and] = [
        where(fn("MONTH", col("created_at")), Number(month)),
      ];
    }

    // Debug (keep during testing)
    console.log("🟢 Material Quotations WHERE:", whereClause);

    const quotations = await MaterialTestingQuotation.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("COUNT", col("qtn_id")), "count"],
        [fn("SUM", col("total_amount")), "totalAmount"],
      ],
      where: whereClause,
      group: [fn("DATE", col("created_at"))],
      order: [[fn("DATE", col("created_at")), "ASC"]],
      raw: true,
    });

    const normalized = quotations.map((q) => ({
      ...q,
      count: Number(q.count) || 0,
      totalAmount: Number(q.totalAmount) || 0,
    }));

    return res.json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    console.error("Error fetching quotations dashboard:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getNdtQuotationsDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;

    // ============================================================
    // CASE 2: FINANCIAL YEAR (month = "", year = "2025-2026")
    // ============================================================
    // ============================================================
    // CASE: FINANCIAL YEAR (month = "", year = "2025-2026")
    // ============================================================
    if (!month && year && year.includes("-")) {
      const [startYear, endYear] = year.split("-").map(Number);

      const startDate = `${startYear}-04-01`;
      const endDate = `${endYear}-03-31`;

      const result = await NdtQuotation.findAll({
        attributes: [
          [fn("YEAR", col("created_at")), "year"],
          [fn("MONTH", col("created_at")), "month"],
          [fn("COUNT", col("qtn_id")), "count"],
          [fn("SUM", col("total")), "totalAmount"],
        ],
        where: {
          created_at: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [fn("YEAR", col("created_at")), fn("MONTH", col("created_at"))],
        order: [
          [fn("YEAR", col("created_at")), "ASC"],
          [fn("MONTH", col("created_at")), "ASC"],
        ],
        raw: true,
      });

      return res.json({
        success: true,
        data: result,
      });
    }

    // ============================================================
    // CASE 1: NORMAL MONTH / YEAR FILTER ✅ FIXED
    // ============================================================
    let whereClause = {};

    // Both year & month selected
    if (year && year !== "all" && month && month !== "all") {
      whereClause[Op.and] = [
        where(fn("YEAR", col("created_at")), Number(year)),
        where(fn("MONTH", col("created_at")), Number(month)),
      ];
    }

    // Only year selected → all months of that year
    else if (year && year !== "all") {
      whereClause[Op.and] = [
        where(fn("YEAR", col("created_at")), Number(year)),
      ];
    }

    // Only month selected → that month across all years
    else if (month && month !== "all") {
      whereClause[Op.and] = [
        where(fn("MONTH", col("created_at")), Number(month)),
      ];
    }

    console.log("🟢 NDT Quotations WHERE:", whereClause);

    const quotations = await NdtQuotation.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("COUNT", col("qtn_id")), "count"],
        [fn("SUM", col("total")), "totalAmount"],
      ],
      where: whereClause,
      group: [fn("DATE", col("created_at"))],
      order: [[fn("DATE", col("created_at")), "ASC"]],
      raw: true,
    });

    const normalized = quotations.map((q) => ({
      ...q,
      count: Number(q.count) || 0,
      totalAmount: Number(q.totalAmount) || 0,
    }));

    return res.json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    console.error("Error in getNdtQuotationsDashboard:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// const getNdtQuotationsDashboard = async (req, res) => {
//   try {
//     const { month, year } = req.query;
//     let whereClause = {};

//     if (year && month && month !== "all") {
//       whereClause[Op.and] = [
//         where(fn("YEAR", col("created_at")), year),
//         where(fn("MONTH", col("created_at")), month),
//       ];
//     } else if (year) {
//       whereClause[Op.and] = [where(fn("YEAR", col("created_at")), year)];
//     } else if (month && month !== "all") {
//       whereClause[Op.and] = [where(fn("MONTH", col("created_at")), month)];
//     }

//     const quotations = await NdtQuotation.findAll({
//       attributes: [
//         [fn("DATE", col("created_at")), "date"],
//         [fn("COUNT", col("qtn_id")), "count"],
//         [fn("SUM", col("total")), "totalAmount"],
//       ],
//       where: whereClause,
//       group: [fn("DATE", col("created_at"))],
//       order: [[fn("DATE", col("created_at")), "ASC"]],
//       raw: true,
//     });

//     const normalized = quotations.map((q) => ({
//       ...q,
//       totalAmount: Number(q.totalAmount) || 0,
//       count: Number(q.count) || 0,
//     }));

//     return res.json({
//       success: true,
//       count: normalized.length,
//       data: normalized,
//     });
//   } catch (error) {
//     console.error("Error in getNdtQuotationsDashboard:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };
// controllers/dashboard/getGtQuotationsDashboard.js

const getGtQuotationsDashboard = async (req, res) => {
  try {
    const { month, year } = req.query;

    // ============================================================
    // CASE 2: FINANCIAL YEAR (month = "", year = "2025-2026")
    // ============================================================
    // ============================================================
    // CASE: FINANCIAL YEAR (month = "", year = "2025-2026")
    // ============================================================
    if (!month && year && year.includes("-")) {
      const [startYear, endYear] = year.split("-").map(Number);

      const startDate = `${startYear}-04-01`;
      const endDate = `${endYear}-03-31`;

      const result = await GtQuotation.findAll({
        attributes: [
          [fn("YEAR", col("created_at")), "year"],
          [fn("MONTH", col("created_at")), "month"],
          [fn("COUNT", col("qtn_id")), "count"],
          [fn("SUM", col("total")), "totalAmount"],
        ],
        where: {
          created_at: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [fn("YEAR", col("created_at")), fn("MONTH", col("created_at"))],
        order: [
          [fn("YEAR", col("created_at")), "ASC"],
          [fn("MONTH", col("created_at")), "ASC"],
        ],
        raw: true,
      });

      return res.json({
        success: true,
        data: result,
      });
    }

    // ============================================================
    // CASE 1: NORMAL MONTH / YEAR FILTER
    // ============================================================
    let whereClause = {};

    if (year && year !== "all" && month && month !== "all") {
      whereClause[Op.and] = [
        where(fn("YEAR", col("created_at")), Number(year)),
        where(fn("MONTH", col("created_at")), Number(month)),
      ];
    } else if (year && year !== "all") {
      whereClause[Op.and] = [
        where(fn("YEAR", col("created_at")), Number(year)),
      ];
    } else if (month && month !== "all") {
      whereClause[Op.and] = [
        where(fn("MONTH", col("created_at")), Number(month)),
      ];
    }

    console.log("🟢 GT FILTER:", { year, month, whereClause });

    const quotations = await GtQuotation.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "date"],
        [fn("COUNT", col("qtn_id")), "count"],
        [fn("SUM", col("total")), "totalAmount"],
      ],
      where: whereClause,
      group: [fn("DATE", col("created_at"))],
      order: [[fn("DATE", col("created_at")), "ASC"]],
      raw: true,
    });

    const normalized = quotations.map((q) => ({
      ...q,
      count: Number(q.count) || 0,
      totalAmount: Number(q.totalAmount) || 0,
    }));

    return res.json({
      success: true,
      count: normalized.length,
      data: normalized,
    });
  } catch (error) {
    console.error("Error in getGtQuotationsDashboard:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getOrdersRevenueDashboard = async (req, res) => {
  try {
    const { start, end, year } = req.query;

    let dateFilter = {};

    if (start && end) {
      dateFilter = {
        dor: {
          [Op.between]: [
            new Date(`${start}T00:00:00.000Z`),
            new Date(`${end}T23:59:59.999Z`),
          ],
        },
      };
    } else if (year) {
      dateFilter = {
        dor: {
          [Op.between]: [
            new Date(`${year}-01-01T00:00:00.000Z`),
            new Date(`${year}-12-31T23:59:59.999Z`),
          ],
        },
      };
    }
    // else → all years

    const orders = await Orders.findAll({
      where: dateFilter,
      attributes: [
        "order_id",
        "dor", // ✅ important
        [fn("DATE", col("dor")), "day"],
        [fn("MONTH", col("dor")), "month"],
        [fn("YEAR", col("dor")), "year"],
        "pn",
        "amount",
        "transportation_fee",
        [literal("(amount + transportation_fee)"), "total_revenue"],
        "project_name",
        "customer_id",
        "ref",
        "proforma",
        "tax_number",
        "sample_data",
        "division",
        "order_number",
        "order_code",
        "branch",
        "status",
        "cancel",
      ],
      raw: true,
    });

    orders.sort((a, b) => new Date(a.dor) - new Date(b.dor));

    const dayWise = {};
    const monthWise = {};
    let totalOrders = 0;
    let totalRevenue = 0;

    for (const data of orders) {
      const { day, month, year, total_revenue } = data;
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;

      dayWise[day] ??= { day, total_orders: 0, total_revenue: 0, orders: [] };
      dayWise[day].total_orders++;
      dayWise[day].total_revenue += Number(total_revenue);
      dayWise[day].orders.push(data);

      monthWise[monthKey] ??= {
        month,
        year,
        total_orders: 0,
        total_revenue: 0,
        orders: [],
      };
      monthWise[monthKey].total_orders++;
      monthWise[monthKey].total_revenue += Number(total_revenue);
      monthWise[monthKey].orders.push(data);

      totalOrders++;
      totalRevenue += Number(total_revenue);
    }

    res.json({
      success: true,
      daily: Object.values(dayWise),
      monthly: Object.values(monthWise),
      totals: { orders: totalOrders, revenue: totalRevenue },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const updateOfflineOrderWithRor = async (req, res) => {
  const t = await sequelize.transaction();
  const {
    ref,
    project_name,
    subject,
    reporting_address,
    customer_id,
    selectedSamples,
    transportation_fee,
    dor,
    order_number,
    pn,
    selected_client_id,
  } = req.body;
  // console.log('triggering')
  try {
    const existingOrder = await Orders.findOne({
      where: { order_number },
      transaction: t,
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    let client_letter_location = existingOrder.letter;

    if (req.file) {
      const orderId = existingOrder.order_id;
      const letterFile = req.file;
      client_letter_location = await uploadWorkOrderFileToS3(
        letterFile,
        orderId,
      );
    }

    const customerDetails = await getCustomerInfoUsingID(customer_id, t);

    const orderDetails = {
      ref,
      project_name,
      subject,
      discount: 0,
      transportation_fee,
      order_number,
    };

    const pdfDetails = {
      isProforma: true,
      pdf_name: `proforma-invoice-${pn}.pdf`,
      previousOrderNumber: pn,
      pn,
    };

    let clientInformation = {};
    if (selected_client_id) {
      const clientDetails = await Client.findOne({
        where: { client_id: selected_client_id },
      });
      const { reporting_name, reporting_address } = clientDetails.dataValues;
      clientInformation.reporting_name = reporting_name;
      clientInformation.reporting_address = reporting_address;
    }

    let billData = {
      orderDetails,
      customerDetails,
    };

    if (division === "GT") {
      billData.geotechnicalItems = geotechnicalItems || [];
    } else {
      billData.selectedSamples = selectedSamples || [];
    }

    const proforma = await generateProformaInvoice(
      billData,
      pdfDetails,
      dor,
      clientInformation,
    );

    const { location, totalAgg } = proforma;

    // 🟡 Update order row
    await Orders.update(
      {
        sample_data: JSON.stringify(selectedSamples),
        ref,
        project_name,
        subject,
        reporting_address,
        customer_id,
        letter: client_letter_location,
        transportation_fee,
        proforma: location,
        dor,
        pn,
        client_id: selected_client_id || null,
      },
      { where: { order_number }, transaction: t },
    );

    const orderId = existingOrder.order_id;

    // 🔴 Remove old samples and params
    const existingSamples = await SampleMaterials.findAll({
      where: { order_id: orderId },
      transaction: t,
    });
    for (let sample of existingSamples) {
      await SampleParams.destroy({
        where: { sample_id: sample.sample_id },
        transaction: t,
      });
    }
    await SampleMaterials.destroy({
      where: { order_id: orderId },
      transaction: t,
    });

    // 🟢 Insert new samples and params
    let basket = [];
    selectedSamples.forEach((eachSample) => {
      const items = Array.from({ length: eachSample.qty }, () => ({
        ...eachSample,
      }));
      if (eachSample.sampleId === "85") {
        basket.push(items[0]);
      } else {
        basket.push(...items);
      }
    });

    const formattedSamples = generateSampleCodes(basket, order_number, dor);

    for (let eachSample of formattedSamples) {
      const {
        sampleId,
        chemicalParams = [],
        physicalParams = [],
        sample_code,
      } = eachSample;

      const sampleRecord = {
        order_id: orderId,
        product_id: sampleId,
        sample_code,
        duedate: due_date,
        sample_id: uuidv4(),
      };

      const insertedSample = await SampleMaterials.create(sampleRecord, {
        transaction: t,
      });

      for (let eachParam of [...chemicalParams, ...physicalParams]) {
        const { paramId, price, params } = eachParam;
        const newParam = {
          sample_id: insertedSample.sample_id,
          param_id: paramId,
          params_info: params,
          param_price: price,
        };
        await SampleParams.create(newParam, { transaction: t });
      }
    }

    await OrderDraft.update(
      { status: "finalized" },
      { where: { order_number }, transaction: t },
    );

    const log = {
      lc_id: 1,
      description: `Order updated for ${customerDetails.billing_name} with WO:${order_number} & Total amount - ${totalAgg}`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };

    await createAlog(log, t);
    await t.commit();

    return res.status(200).json({
      message: "Order updated successfully",
      data: {
        orderId,
        project_name,
        subject,
        registration_done: true,
      },
    });
  } catch (err) {
    console.error(err);
    await t.rollback();

    if (err.name === SequelizeUniqueConstraintError) {
      return res.status(500).json({
        message: "Duplicate Entry (Workorder or Proforma Number), please check",
      });
    } else {
      return res.status(500).json({
        message: "Internal server error, please check",
      });
    }
  }
};

const getProformaInvoicesDaily = async (req, res) => {
  try {
    // 1️⃣ Fetch all proformas (pn not null, dor not null)
    const proformas = await Orders.findAll({
      where: {
        pn: { [Op.ne]: null },
        dor: { [Op.ne]: null },
      },
      attributes: [
        "order_id",
        [fn("DATE", col("dor")), "day"],
        [fn("MONTH", col("dor")), "month"],
        [fn("YEAR", col("dor")), "year"],
        "pn",
        "amount",
        "transportation_fee",
        [literal("(amount + transportation_fee)"), "total_revenue"],
        "project_name",
        "customer_id",
        "ref",
        "proforma",
        "tax_number",
      ],
      order: [["dor", "ASC"]],
    });

    // 2️⃣ JS aggregation: day-wise & month-wise
    const dayWise = {};
    const monthWise = {};
    let grandTotalProformas = 0;
    let grandTotalRevenue = 0;

    proformas.forEach((p) => {
      const data = p.get({ plain: true });
      const { day, month, year, total_revenue } = data;

      // --- Day-wise ---
      if (!dayWise[day]) {
        dayWise[day] = {
          day,
          total_proformas: 0,
          total_revenue: 0,
          proformas: [],
        };
      }
      dayWise[day].total_proformas += 1;
      dayWise[day].total_revenue += Number(total_revenue);
      dayWise[day].proformas.push(data);

      // --- Month-wise ---
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      if (!monthWise[monthKey]) {
        monthWise[monthKey] = {
          month: month,
          year: year,
          total_proformas: 0,
          total_revenue: 0,
          proformas: [],
        };
      }
      monthWise[monthKey].total_proformas += 1;
      monthWise[monthKey].total_revenue += Number(total_revenue);
      monthWise[monthKey].proformas.push(data);

      // --- Grand totals ---
      grandTotalProformas += 1;
      grandTotalRevenue += Number(total_revenue);
    });

    return res.status(200).json({
      daily: Object.values(dayWise),
      monthly: Object.values(monthWise),
      totals: {
        proformas: grandTotalProformas,
        revenue: grandTotalRevenue,
      },
    });
  } catch (error) {
    console.error("Error in getAllProformaStats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const getTaxInvoicesDaily = async (req, res) => {
  try {
    // 1️⃣ Fetch only orders with tax_number not null
    const taxInvoices = await Orders.findAll({
      where: {
        pn: { [Op.ne]: null },
        dor: { [Op.ne]: null },
        tax_number: { [Op.ne]: null },
      },
      attributes: [
        "order_id",
        [fn("DATE", col("dor")), "day"],
        [fn("MONTH", col("dor")), "month"],
        [fn("YEAR", col("dor")), "year"],
        "pn",
        "amount",
        "transportation_fee",
        [literal("(amount + transportation_fee)"), "total_revenue"],
        "project_name",
        "customer_id",
        "ref",
        "proforma",
        "tax_number",
      ],
      order: [["dor", "ASC"]],
    });

    // 2️⃣ JS aggregation: day-wise & month-wise
    const dayWise = {};
    const monthWise = {};
    let grandTotalInvoices = 0;
    let grandTotalRevenue = 0;

    taxInvoices.forEach((t) => {
      const data = t.get({ plain: true });
      const { day, month, year, total_revenue } = data;

      // --- Day-wise ---
      if (!dayWise[day]) {
        dayWise[day] = {
          day,
          total_invoices: 0,
          total_revenue: 0,
          invoices: [],
        };
      }
      dayWise[day].total_invoices += 1;
      dayWise[day].total_revenue += Number(total_revenue);
      dayWise[day].invoices.push(data);

      // --- Month-wise ---
      const monthKey = `${year}-${String(month).padStart(2, "0")}`;
      if (!monthWise[monthKey]) {
        monthWise[monthKey] = {
          month: month,
          year: year,
          total_invoices: 0,
          total_revenue: 0,
          invoices: [],
        };
      }
      monthWise[monthKey].total_invoices += 1;
      monthWise[monthKey].total_revenue += Number(total_revenue);
      monthWise[monthKey].invoices.push(data);

      // --- Grand totals ---
      grandTotalInvoices += 1;
      grandTotalRevenue += Number(total_revenue);
    });

    return res.status(200).json({
      daily: Object.values(dayWise),
      monthly: Object.values(monthWise),
      totals: {
        invoices: grandTotalInvoices,
        revenue: grandTotalRevenue,
      },
    });
  } catch (error) {
    console.error("Error in getTaxInvoicesDaily:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const offlineOrderRegistrationWithRor = async (req, res) => {
  const t = await sequelize.transaction();
  let {
    ref,
    project_name,
    subject,
    reporting_address,
    customer_id,
    selectedSamples,
    transportation_fee,
    dor,
    order_number,
    pn,
    selected_client_id,
    selectedGst,
    division,
    order_code,
    geotechnicalItems,
    ndtItems,
    branch,
  } = req.body;
  if (division !== "GT") {
    branch = "VZG"; // LAB (and others) always Vizag
  }
  try {
    // console.log("REQ BODY:", JSON.stringify(req.body, null, 2));

    if (!req.file) {
      return res.status(400).json({ error: "No letter uploaded" });
    }

    // Generate unique order number for GT
    if (division === "GT") {
      const generateUniqueOrderNumber = () => {
        return Math.floor(1000000000 + Math.random() * 9000000000);
      };
      order_number = generateUniqueOrderNumber();
    }

    const orderId = uuidv4();
    const letterFile = req.file;

    // Upload work order letter
    const client_letter_location = await uploadWorkOrderFileToS3(
      letterFile,
      orderId,
    );

    const customerDetails = await getCustomerInfoUsingID(customer_id, t);

    const orderDetails = {
      ref,
      project_name,
      subject,
      discount: 0,
      transportation_fee,
      order_number: order_code,
      branch,
    };

    const pdfDetails = {
      isProforma: true,
      pdf_name: `proforma-invoice-${pn}.pdf`,
      previousOrderNumber: pn,
      pn,
    };

    let clientInformation = {};
    if (selected_client_id) {
      const clientDetails = await Client.findOne({
        where: { client_id: selected_client_id },
      });
      const { reporting_name, reporting_address } = clientDetails.dataValues;
      clientInformation.reporting_name = reporting_name;
      clientInformation.reporting_address = reporting_address;
    }

    // Ensure selectedSamples is always an array
    if (typeof selectedSamples === "string")
      selectedSamples = JSON.parse(selectedSamples);
    selectedSamples = selectedSamples || [];

    // Prepare billData for PDF
    const billData = { orderDetails, customerDetails };
    if (division === "GT") {
      billData.geotechnicalItems = Array.isArray(geotechnicalItems)
        ? geotechnicalItems
        : [];
      // console.log(
      //   "GT billData.geotechItems:",
      //   JSON.stringify(billData.geotechnicalItems, null, 2)
      // );
    } else if (division === "NDT") {
      billData.ndtItems = Array.isArray(ndtItems) ? ndtItems : [];
    } else {
      billData.selectedSamples = selectedSamples;
      // console.log(
      //   "LAB billData.selectedSamples:",
      //   JSON.stringify(billData.selectedSamples, null, 2)
      // );
    }

    // Generate Proforma PDF
    let proforma;
    if (division === "GT") {
      proforma = await generateGeotechProformaInvoice(
        billData,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
      );
      // console.log("GT PDF generated at:", proforma.location);
    } else if (division === "NDT") {
      proforma = await generateNdtProformaInvoice(
        billData,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
      );
      // console.log("GT PDF generated at:", proforma.location);
    } else {
      proforma = await generateProformaInvoice(
        billData,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
      );
      // console.log("LAB PDF generated at:", proforma.location);
    }

    const { location, totalAgg } = proforma;

    console.log(selectedSamples, "b976");
    // Prepare basket arrays
    let clubForCore = "";
    const basket = [];
    const basket2 = [];
    for (const eachSample of selectedSamples) {
      console.log(eachSample.physicalParams, "physicalParams76");
      if (eachSample.sampleId === "62") {
        const clubId = eachSample.club_id || eachSample.clubId_list?.[0];
        clubForCore = eachSample.club_id || eachSample.clubId_list?.[0];
        const clubTestRecord = await ClubTests.findOne({
          where: { club_id: clubId },
          attributes: ["test_requirement"],
          transaction: t,
        });
        const testRequirement = clubTestRecord?.test_requirement;
        const coreDetails = testRequirement?.coreDetails || [];
        console.log(coreDetails, "coreDetails23");
        const qty = coreDetails.length || 1;

        for (let i = 0; i < qty; i++) {
          const core = coreDetails[i];
          console.log(core, "vh89");
          const sampleClone = {
            ...eachSample,
            club_id: clubId,
            sample_id: uuidv4(),
          };
          // sampleClone.physicalParams = (sampleClone.physicalParams || []).map(
          //   (param) => {
          //     if (param.paramId === "20240725182402705") {
          //       return { ...param, isNabl: core?.nabl ? "1" : "0" };
          //     }
          //     return param;
          //   }
          // );

          // Choose correct param based on NABL flag
          const filteredParams = (eachSample.physicalParams || []).filter(
            (param) => {
              if (core?.nabl) {
                return String(param.paramId) === "20240725182402705";
              } else {
                return String(param.paramId) === "20240725182338307";
              }
            },
          );

          // Set the filtered params
          sampleClone.physicalParams = filteredParams.map((param) => ({
            ...param,
            isNabl: core?.nabl ? 1 : 0, // Ensure isNabl flag matches
          }));

          basket.push(sampleClone);
          basket2.push(sampleClone);
        }
      } else if (
        String(eachSample.sampleId) === "85" ||
        String(eachSample.sampleId) === "156" ||
        String(eachSample.sampleId) === "172" ||
        String(eachSample.sampleId) === "155" ||
        String(eachSample.sampleId) === "120"
      ) {
        basket.push({
          ...eachSample,
          club_id: eachSample.clubId_list[0],
          sample_id: uuidv4(),
        });
        basket2.push({
          ...eachSample,
          sample_id: uuidv4(),
          club_id: eachSample.clubId_list[0],
        });
      } else {
        for (const clubId of eachSample.clubId_list) {
          basket.push({
            ...eachSample,
            club_id: clubId,
            sample_id: uuidv4(),
          });
          basket2.push({
            ...eachSample,
            sample_id: uuidv4(),
            club_id: clubId,
          });
        }
      }
    }

    // selectedSamples.forEach(async (eachSample) => {
    //   // let newId = uuidv4();

    //   if (eachSample.sampleId === "62") {
    //     // let qty = parseInt(eachSample.qty) || 1;
    //     let qty =1;
    //     const clubId = eachSample.club_id || eachSample.clubId_list?.[0];

    //   const clubTestRecord = await ClubTests.findOne({
    //       where: { club_id:clubId },
    //       attributes: ["test_requirement"],
    //       transaction: t,
    //     });

    //     console.log(clubTestRecord.test_requirement,'clubTestRecord67')
    //     console.log(eachSample,'eachSample675')

    //     if (qty % 3 === 0) {
    //       qty = qty / 3;
    //     }

    //     for (let i = 0; i < qty; i++) {
    //       basket.push({
    //         ...eachSample,
    //         club_id: clubId,
    //         sample_id: uuidv4(),
    //       });
    //     }
    //   } else if (eachSample.sampleId === "85") {
    //     basket.push({
    //       ...eachSample,
    //       club_id: eachSample.clubId_list[0],
    //       sample_id: uuidv4(),
    //     });
    //     basket2.push({
    //       ...eachSample,
    //       sample_id: uuidv4(),
    //       club_id: eachSample.clubId_list[0],
    //     });
    //   } else {
    //     eachSample.clubId_list.forEach((clubId) => {
    //       basket.push({
    //         ...eachSample,
    //         club_id: clubId,
    //         sample_id: uuidv4(),
    //       });
    //       basket2.push({
    //         ...eachSample,
    //         sample_id: uuidv4(),
    //         club_id: clubId,
    //       });
    //     });
    //   }
    // });

    console.log(basket2, "basky23");

    await Ledger.create({
      customer_id: customer_id,
      ledger_date: dor,
      entries: [
        {
          pi: pn,
          debit: totalAgg,
          credit: null,
          vch_no: "-",
          remarks: "-",
          vch_type: "-",
          pi_amount: totalAgg,
          ti_amount: "-",
          particulars: "-",
          mode_of_payment: "-",
        },
      ],
      order_number: order_code,
      tax_number: "-",
      tax_converted_date: "-",
    });

    if (division === "GT") {
      if (Array.isArray(geotechnicalItems) && geotechnicalItems.length > 0) {
        basket2.push(
          ...geotechnicalItems.map((item) => ({
            ...item,
            sample_id: uuidv4(),
          })),
        );
      }
    }
    // Create order in DB
    await Orders.create(
      {
        sample_data:
          division === "GT"
            ? JSON.stringify(billData?.geotechnicalItems || [])
            : division === "NDT"
              ? JSON.stringify(billData?.ndtItems)
              : JSON.stringify(selectedSamples),
        ref,
        order_id: orderId,
        project_name,
        subject,
        reporting_address,
        customer_id,
        letter: client_letter_location,
        transportation_fee,
        proforma: location,
        tax_number: null,
        amount: totalAgg,
        dor,
        order_number: division === "NDT" ? order_code : order_number,
        division,
        order_code,
        pn,
        tax_converted_date: null,
        client_id: selected_client_id || null,
        gst: selectedGst,
        branch: branch,
      },
      { transaction: t },
    );

    // LAB-specific inline sample handling
    if (division === "LAB" && order_number) {
      const formattedSamples = generateSampleCodes(basket2, order_number, dor);

      let hasChemical = false;
      let hasPhysical = false;

      // console.log(formattedSamples, "formattedSamples345");

      const clubTestRecord237 = await ClubTests.findOne({
        where: { club_id: clubForCore },
        attributes: ["test_requirement"],
        transaction: t,
      });

      let testRequirement745 = clubTestRecord237?.test_requirement;

      // Deep copy coreDetails
      let availableCoreDetails765 = [
        ...(testRequirement745?.coreDetails || []),
      ];

      for (const eachSample of formattedSamples) {
        const {
          sampleId,
          chemicalParams = [],
          physicalParams = [],
          sample_code,
          club_id,
          due_date,
          sample_id,
        } = eachSample;
        if (chemicalParams.length) hasChemical = true;
        if (physicalParams.length) hasPhysical = true;

        // Fetch clubTestRecord for all samples
        const clubTestRecord = await ClubTests.findOne({
          where: { club_id },
          attributes: ["test_requirement"],
          transaction: t,
        });

        let sampleTestReq = clubTestRecord
          ? clubTestRecord.test_requirement
          : null;

        // console.log(sampleTestReq, "sampleTestReq356");

        if (sampleId === "62") {
          // --- special handling for Concrete sample ---

          // Assign coreDetails uniquely per physical param
          const assignedCoreDetails = [];

          for (const param of physicalParams) {
            if (!availableCoreDetails765.length) break; // safety

            const coreIndex = availableCoreDetails765.findIndex((c) => {
              if (param.paramId === "20240725182402705") return c.nabl === true;
              if (param.paramId === "20240725182716784")
                return c.nabl === false;
              return false;
            });

            if (coreIndex !== -1) {
              assignedCoreDetails.push(availableCoreDetails765[coreIndex]);
              availableCoreDetails765.splice(coreIndex, 1); // remove so it's not reused
              // console.log(availableCoreDetails765, "availableCoreDetails765");
            }
          }

          const sampleTestReq = {
            ...testRequirement745,
            coreDetails: assignedCoreDetails,
          };

          const sampleRecord = {
            order_id: orderId,
            product_id: sampleId,
            sample_code,
            duedate: due_date,
            sample_id,
            club_id,
            test_req: sampleTestReq,
            registered: true,
          };

          await SampleMaterials.create(sampleRecord, { transaction: t });
          await SampleMaterialFields.update(
            { sample_id },
            { where: { club_id } },
          );

          for (const param of [...chemicalParams, ...physicalParams]) {
            const { paramId, price, params } = param;
            await SampleParams.create(
              {
                sample_id,
                param_id: String(paramId),
                params_info: params,
                param_price: price,
              },
              { transaction: t },
            );
          }

          await classifySampleParamsAndUpdateDB(sample_id, t);
        } else {
          // --- default handling for all other samples ---
          const sampleRecord = {
            order_id: orderId,
            product_id: sampleId,
            sample_code,
            duedate: due_date,
            sample_id,
            club_id,
            test_req: clubTestRecord ? clubTestRecord.test_requirement : null,
            registered: true,
          };

          await SampleMaterials.create(sampleRecord, { transaction: t });
          await SampleMaterialFields.update(
            { sample_id },
            { where: { club_id } },
          );

          for (const param of [...chemicalParams, ...physicalParams]) {
            const { paramId, price, params } = param;
            await SampleParams.create(
              {
                sample_id,
                param_id: String(paramId),
                params_info: params,
                param_price: price,
              },
              { transaction: t },
            );
          }

          await classifySampleParamsAndUpdateDB(sample_id, t);
        }
      }

      //       for (const eachSample of formattedSamples) {
      //         const {
      //           sampleId,
      //           chemicalParams = [],
      //           physicalParams = [],
      //           sample_code,
      //           club_id,
      //           due_date,
      //           sample_id,
      //         } = eachSample;
      // console.log(eachSample,'eachsampe234')
      // console.log(physicalParams,'physicalParams357')
      //         if (chemicalParams.length) hasChemical = true;
      //         if (eachSample.chemicalParams && eachSample.chemicalParams.length > 0) {
      //           hasChemical = true;
      //         }
      //         if (eachSample.physicalParams && eachSample.physicalParams.length > 0) {
      //           hasPhysical = true;
      //         }

      //         const clubTestRecord = await ClubTests.findOne({
      //           where: { club_id },
      //           attributes: ["test_requirement"],
      //           transaction: t,
      //         });

      //         const sampleRecord = {
      //           order_id: orderId,
      //           product_id: sampleId,
      //           sample_code,
      //           duedate: due_date,
      //           sample_id,
      //           club_id,
      //           test_req: clubTestRecord ? clubTestRecord.test_requirement : null,
      //           registered: true,
      //         };

      //         await SampleMaterials.create(sampleRecord, { transaction: t });
      //         await SampleMaterialFields.update(
      //           { sample_id },
      //           { where: { club_id } }
      //         );

      //         for (const param of [...chemicalParams, ...physicalParams]) {
      //           const { paramId, price, params } = param;
      //           await SampleParams.create(
      //             {
      //               sample_id,
      //               param_id: String(paramId),
      //               params_info: params,
      //               param_price: price,
      //             },
      //             { transaction: t }
      //           );
      //         }

      //         await classifySampleParamsAndUpdateDB(sample_id, t);
      //       }

      try {
        await sendWhatsAppMessage(
          customerDetails.mobile,
          `Hi ${customerDetails.billing_name}, We’re pleased to inform you that your order has been successfully placed.Your proforma invoice for WO:${order_number} is ready. Download here: \n\n\n\nThank you for entrusting KDM Engineers India (Pvt) Ltd with your testing requirements.`,
          // process.env.CALLMEBOT_API_KEY
        );
        console.log("Whatsapp msg sent successfully");
      } catch (wErr) {
        console.error("❌ Whatsapp msg sending failed:", wErr);
      }

      // Send notifications to HODs
      if (hasChemical) {
        const mechHod = await Employee.findOne({
          where: {
            access_key: "KDM_HOD_TOKEN",
            department: "LABORATORY_MECHANICAL",
          },
        });
        if (mechHod) {
          await Notification.create(
            {
              receiver_emp_id: mechHod.emp_id,
              message: `New order WO:${order_number} registered with physical parameters. Please review and assign.`,
              order_number,
              acknowledge: false,
            },
            { transaction: t },
          );
        }
      }

      if (hasPhysical) {
        const chemHod = await Employee.findOne({
          where: {
            access_key: "KDM_HOD_TOKEN",
            department: "LABORATORY_CHEMICAL",
          },
        });
        if (chemHod) {
          await Notification.create(
            {
              receiver_emp_id: chemHod.emp_id,
              message: `New order WO:${order_number} registered with chemical parameters. Please review and assign.`,
              order_number,
              acknowledge: false,
            },
            { transaction: t },
          );
        }
      }

      await OrderDraft.update(
        { status: "finalized" },
        { where: { order_number } },
      );
    }

    // Log
    const sortedSamples = selectedSamples.sort(
      (a, b) => new Date(a.due_date) - new Date(b.due_date),
    );
    const details = sortedSamples.map((sample) => {
      const formattedDate = new Date(sample.due_date).toLocaleDateString(
        "en-US",
        { day: "numeric", month: "long", year: "numeric" },
      );
      return `the sample ${sample.sampleName} is expected to be completed by ${formattedDate}`;
    });
    const reportLines = `Based on the current schedule, ${details.join(", ")}. We will keep you updated on the progress and notify you upon completion of each test report.`;

    // try {
    //   await sendOrderEmail(
    //     customerDetails.email,
    //     customerDetails.billing_name,
    //     order_number,
    //     reportLines,
    //     buffer,
    //   );

    //   console.log("Mail sent successfully");
    // } catch (emailErr) {
    //   console.error("❌ Email sending failed:", emailErr);
    // }

    const s3Link = `https://${process.env.MATERIAL_TESTING_PROFORMAS}.s3.ap-south-1.amazonaws.com/${location}`;

    try {
      await sendWhatsAppMessage(
        customerDetails.mobile,
        `Hi ${customerDetails.billing_name}, We’re pleased to inform you that your order has been successfully placed.Your proforma invoice for WO:${order_number} is ready. Download here: ${s3Link}\n\n${reportLines}\n\nThank you for entrusting KDM Engineers India (Pvt) Ltd with your testing requirements.`,
        // process.env.CALLMEBOT_API_KEY,
      );
      console.log("Whatsapp msg sent successfully");
    } catch (wErr) {
      console.error("❌ Whatsapp msg sending failed:", wErr);
    }

    const log = {
      lc_id: 1,
      description: `New order registered from ${customerDetails.billing_name} with WO:${order_code} & Total amount - ${totalAgg}`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };
    await createAlog(log, t);

    await t.commit();

    return res.status(200).json({
      message: "Order registration completed successfully",
      data: { orderId, project_name, subject, registration_done: true },
    });
  } catch (err) {
    console.error(err);
    await t.rollback();
    if (err.name === SequelizeUniqueConstraintError) {
      return res.status(500).json({
        message: "Duplicate Entry (Workorder or Proforma Number), please check",
      });
    } else {
      return res
        .status(500)
        .json({ message: "Internal server error, please check" });
    }
  }
};
// const repeatSampleOrder = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const { sample_id } = req.body;

//     // 1️⃣ Get old sample + order
//     const oldSample = await SampleMaterials.findOne({
//       where: { sample_id },
//       include: [
//         { model: Orders, as: "order" },
//         { model: SampleParams, as: "params" },
//         { model: SampleMaterialFields, as: "fields" },
//       ],
//       transaction: t,
//     });

//     if (!oldSample) {
//       return res.status(404).json({ error: "Sample not found" });
//     }

//     const oldOrder = oldSample.order;

//     // 2️⃣ Generate new order number
//     const maxOrder = await Orders.max("order_number");
//     const newOrderNumber = Number(maxOrder || 0) + 1;
//     const newOrderId = uuidv4();

//     // 3️⃣ Create new order (FREE repeat)
//     const newOrder = await Orders.create(
//       {
//         ref: oldOrder.ref,
//         project_name: oldOrder.project_name,
//         subject: oldOrder.subject,
//         reporting_address: oldOrder.reporting_address,
//         customer_id: oldOrder.customer_id,
//         transportation_fee: 0,
//         proforma: null,
//         tax_number: null,
//         amount: 0, // 🔥 FREE
//         dor: new Date(),
//         order_number: newOrderNumber,
//         division: oldOrder.division,
//         order_code: oldOrder.order_code,
//         pn: null,
//         gst: oldOrder.gst,
//         branch: oldOrder.branch,
//         sample_data: JSON.stringify([]),
//         is_repeat: true,
//       },
//       { transaction: t },
//     );

//     // 4️⃣ Create new sample
//     const newSampleId = uuidv4();
//     await SampleMaterials.create(
//       {
//         order_id: newOrderId,
//         product_id: oldSample.product_id,
//         sample_code: oldSample.sample_code + "-R1",
//         duedate: new Date(),
//         sample_id: newSampleId,
//         club_id: oldSample.club_id,
//         test_req: oldSample.test_req,
//         registered: true,
//         is_repeat: true,
//         repeated_from_sample_id: sample_id,
//         repeat_cycle: 1,
//       },
//       { transaction: t },
//     );

//     // 5️⃣ Copy Fields
//     for (const f of oldSample.fields || []) {
//       await SampleMaterialFields.create(
//         {
//           sample_id: newSampleId,
//           club_id: f.club_id,
//           field_name: f.field_name,
//           field_value: f.field_value,
//         },
//         { transaction: t },
//       );
//     }

//     // 6️⃣ Copy Params (FREE)
//     for (const p of oldSample.params || []) {
//       await SampleParams.create(
//         {
//           sample_id: newSampleId,
//           param_id: p.param_id,
//           params_info: p.params_info,
//           param_price: 0,
//           finished: false,
//           status: "NOT_YET_ASSIGNED",
//         },
//         { transaction: t },
//       );
//     }

//     await t.commit();

//     return res.json({
//       success: true,
//       newOrderNumber,
//       newSampleId,
//     });
//   } catch (err) {
//     await t.rollback();
//     console.error("Repeat Error:", err);
//     res.status(500).json({ error: "Repeat test failed" });
//   }
// };

const offlineOrderRegistration = async (req, res) => {
  const t = await sequelize.transaction();
  const {
    ref,
    project_name,
    subject,
    reporting_address,
    customer_id,
    selectedSamples,
    transportation_fee,
    dor,
    order_number,
    pn,
    selected_client_id,
  } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No letter uploaded" });
    }

    const orderId = uuidv4();
    const letterFile = req.file;

    //letter work order
    const client_letter_location = await uploadWorkOrderFileToS3(
      letterFile,
      orderId,
    );
    // const client_letter_location = "some link";
    const customerDetails = await getCustomerInfoUsingID(customer_id, t);
    const orderDetails = {
      ref,
      project_name,
      subject,
      // discount: customerDetails.discount,
      discount: 0,

      transportation_fee,
      order_number,
    };

    const pdfDetails = {
      isProforma: true,
      pdf_name: `proforma-invoice-${pn}.pdf`,
      previousOrderNumber: pn,
      pn,
    };

    let clientInformation = {};

    if (selected_client_id) {
      const clientDetails = await Client.findOne({
        where: { client_id: selected_client_id },
      });
      const { reporting_name, reporting_address } = clientDetails.dataValues;
      clientInformation.reporting_name = reporting_name;
      clientInformation.reporting_address = reporting_address;
    }
    // console.log(clientInformation, 'clientInformation')

    const billData = { selectedSamples, orderDetails, customerDetails };

    // const sign = SRC_PATH + `/${req.emp_id}-sign`;
    // const authorisedSign = req.emp_id ? await getsignFile(sign) : null;
    const proforma = await generateProformaInvoice(
      billData,
      pdfDetails,
      dor,
      clientInformation,
      // authorisedSign
    );
    // const proforma = "hello";

    const { location, totalAgg } = proforma;

    let basket = [];
    selectedSamples.forEach((eachSample) => {
      const items = Array.from({ length: eachSample.qty }, () => ({
        ...eachSample,
      }));

      if (eachSample.sampleId === "85") {
        //combining all samples of steel
        basket.push(items[0]);
      } else {
        basket.push(...items);
      }
    });

    // console.log('Triggered no May', pn)

    await Orders.create(
      {
        sample_data: JSON.stringify(selectedSamples),
        ref,
        order_id: orderId,
        project_name,
        subject,
        reporting_address,
        customer_id,
        letter: client_letter_location,
        transportation_fee,
        proforma: location,
        tax_number: null,
        amount: 5,
        dor: dor,
        order_number,
        pn,
        tax_converted_date: null,
        client_id: selected_client_id ? selected_client_id : null,
      },
      { transaction: t },
    );

    // const maxOrderNumber = orderCreateResponse.order_number;
    const maxOrderNumber = order_number;

    const formattedSamples = generateSampleCodes(basket, maxOrderNumber, dor);

    for (let eachSample of formattedSamples) {
      const {
        sampleId,
        chemicalParams = [],
        physicalParams = [],
        sample_code,
        due_date,
      } = eachSample;

      const sampleRecord = {
        order_id: orderId,
        product_id: sampleId,
        sample_code,
        sample_id: uuidv4(),
        duedate: due_date,
      };
      console.log(sampleRecord, "ssaews");

      const insertedSample = await SampleMaterials.create(sampleRecord, {
        transaction: t,
      });

      for (let eachParam of [...chemicalParams, ...physicalParams]) {
        const { paramId, price, params } = eachParam;
        const newParam = {
          sample_id: insertedSample.sample_id,
          param_id: paramId,
          params_info: params,
          param_price: price,
        };
        await SampleParams.create(newParam, { transaction: t });
      }
    }

    const log = {
      lc_id: 1,
      description: `New order registered from ${customerDetails.billing_name} with WO:${order_number} & Total amount - ${totalAgg} `,
      logged_by: req.emp_id,
      ip: getIp(req),
    };

    await createAlog(log, t);

    await t.commit();
    return res.status(200).json({
      message: "Order registration completed successfully",
      data: {
        orderId,
        project_name,
        subject,
        registration_done: true,
        // mode: "OFFLINE",
      },
    });
  } catch (err) {
    console.log(err);
    await t.rollback();
    // return res.status(500).json({ message: "Internal server error" });

    if (err.name === SequelizeUniqueConstraintError) {
      return res.status(500).json({
        message: "Duplicate Entry (Workorder or Proforma Number), please check",
      });
    } else {
      return res.status(500).json({
        message: "Internal server error, please check",
      });
    }
  }
};

const getCompleteOrderDetails = async (req, res) => {
  const { id } = req.params;
  const t = await sequelize.transaction();

  try {
    const order = await Orders.findByPk(id, {
      transaction: t,
      raw: true,
    });

    const customerInfo = await getCustomerByCustomerId(order.customer_id, t);

    const samplesList = [];
    const samples = await SampleMaterials.findAll(
      {
        where: {
          order_id: id,
        },
      },
      { transaction: t },
    );

    for (let eachSampleOfIthOrder of samples) {
      const sample = {
        sample_id: eachSampleOfIthOrder.sample_id,
        product_id: eachSampleOfIthOrder.product_id,
        isOffer: eachSampleOfIthOrder.isOffer,
        offer: eachSampleOfIthOrder.offer,
        chemicalParams: [],
        physicalParams: [],
        brandName: eachSampleOfIthOrder.brandName,
        created_at: eachSampleOfIthOrder.created_at,
        grade: eachSampleOfIthOrder.grade,
        quantity: eachSampleOfIthOrder.quantity,
        ref_code: eachSampleOfIthOrder.ref_code,
        sample_id_optional_field: eachSampleOfIthOrder.sample_id_optional_field,
        source: eachSampleOfIthOrder.source,
        week_no: eachSampleOfIthOrder.week_no,
        sample_code: eachSampleOfIthOrder.sample_code,
      };

      const productAdditionalInfo = await Product.findByPk(
        eachSampleOfIthOrder.product_id,
        { transaction: t },
      );

      sample.name = productAdditionalInfo.name;
      sample.image = productAdditionalInfo.image;

      const paramsList = await SampleParams.findAll(
        {
          where: {
            sample_id: eachSampleOfIthOrder.sample_id,
          },
        },
        { transaction: t },
      );

      for (let eachParamOfTotalSamples of paramsList) {
        const param = {
          param_id: eachParamOfTotalSamples.param_id,
          orderedPrice: eachParamOfTotalSamples.param_price,
        };

        const paramInfo = await Params.findByPk(
          eachParamOfTotalSamples.param_id,
          { transaction: t },
        );

        param.selectedParams = JSON.parse(paramInfo.params);
        if (paramInfo.discipline === "CHEMICAL") {
          sample.chemicalParams.push(param);
        } else {
          sample.physicalParams.push(param);
        }
      }
      samplesList.push(sample);
    }

    const result = { ...order, samplesList };

    await t.commit();
    return res.status(200).json({ data: result, customerInfo });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getOrderUpdateFormData = async (req, res) => {
  const { order_id } = req.params;

  try {
    // 1️⃣ Order basic info
    const orderInfo = await Orders.findOne({
      where: { order_id },
    });

    if (!orderInfo) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2️⃣ Registered samples for this order (KEEP AS IS)
    const registeredSamples = await SampleMaterials.findAll({
      where: { order_id },
      include: [
        {
          model: SampleParams,
          as: "params",
          attributes: ["param_id", "params_info", "param_price"],
        },
      ],
    });

    // ✅ collect clubIds
    const clubIds = registeredSamples.map((s) => s.club_id).filter(Boolean);

    // ✅ fetch dynamic fields separately (NO association dependency)
    const sampleFields = await SampleMaterialFields.findAll({
      where: {
        club_id: clubIds,
      },
      attributes: ["club_id", "field_name", "field_value"],
    });

    // ✅ group fields by club_id
    const fieldsByClubId = {};
    for (const row of sampleFields) {
      if (!fieldsByClubId[row.club_id]) {
        fieldsByClubId[row.club_id] = [];
      }

      fieldsByClubId[row.club_id].push({
        field_name: row.field_name,
        field_value: row.field_value,
      });
    }

    // 3️⃣ Normalize response by sample_id (LOGIC KEPT)
    const sampleRegisterData = {};
    for (const sample of registeredSamples) {
      if (sample.club_id) {
        sampleRegisterData[sample.club_id] = {
          test_req: sample.test_req,
          params: sample.params || [],
          fields: fieldsByClubId[sample.club_id] || [], // ✅ ONLY ADDITION
        };
      }
    }

    // 🔥 MERGE registeredSamples into sample_data using club_id (UNCHANGED)
    let mergedSampleData = [];

    try {
      const rawSampleData =
        typeof orderInfo.sample_data === "string"
          ? JSON.parse(orderInfo.sample_data)
          : orderInfo.sample_data || [];

      mergedSampleData = rawSampleData.map((s) => {
        const clubId =
          s.club_id ||
          (Array.isArray(s.clubId_list) && s.clubId_list.length
            ? s.clubId_list[0]
            : null) ||
          s.row_id;

        return {
          ...s,
          reportFields: clubId ? sampleRegisterData[clubId] || null : null,
        };
      });
    } catch (e) {
      console.error("sample_data merge failed:", e);
    }

    return res.status(200).json({
      data: {
        ...orderInfo.toJSON(),
        sample_data: mergedSampleData,
      },
      registeredSamples: sampleRegisterData,
    });
  } catch (err) {
    console.error("getOrderUpdateFormData error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getOrderDraftUpdateFormData = async (req, res) => {
  const { order_number } = req.params;
  try {
    const orderInfo = await OrderDraft.findByPk(order_number);
    return res.status(200).json({ data: orderInfo });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateOfflineOrder = async (req, res) => {
  const t = await sequelize.transaction();
  const orderId = req.params.orderId;

  // Safe parse: accepts JSON string, objects, or returns raw string if unparseable
  const safeParse = (value) => {
    if (value == null) return value;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch (e) {
      // fallback: try to sanitize newline characters and parse again
      try {
        const cleaned = String(value)
          .replace(/\r?\n/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return JSON.parse(cleaned);
      } catch (ee) {
        return String(value);
      }
    }
  };

  // Normalize params to either JSON string or cleaned scalar string
  const normalizeParams = (params) => {
    if (params == null) return null;
    if (typeof params === "object") {
      try {
        return JSON.stringify(params);
      } catch (e) {
        return String(params);
      }
    }
    // string
    const cleaned = String(params)
      .replace(/\r?\n/g, " ")
      .replace(/\t/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned;
  };

  // Normalize incoming sample param objects and preserve fallback fields
  const normalizeSampleParamObject = (p) => {
    return {
      paramId: p?.paramId ? String(p.paramId) : undefined,
      price: p?.price != null ? Number(p.price) : undefined,
      params: p?.params ? p.params : p?.params_info ? p.params_info : null,
      isNabl: p?.isNabl === "1" || p?.isNabl === 1 || p?.isNabl === true,
      ...(p || {}),
    };
  };

  // Classify params and upsert Jobs without losing existing jobs for the sample
  const classifySampleParamsAndUpdateDBwithoutLosingOld2 = async (
    sampleId,
    transaction,
  ) => {
    const sampleParams = await SampleParams.findAll({
      where: { sample_id: sampleId },
      include: [
        {
          model: Params,
          as: "param",
          attributes: ["discipline", "is_nabl"],
        },
      ],
      transaction,
    });

    const classification = {
      chemical_nabl: { discipline: "CHEMICAL", params: [], nabl_status: true },
      chemical_non_nabl: {
        discipline: "CHEMICAL",
        params: [],
        nabl_status: false,
      },
      physical_nabl: { discipline: "PHYSICAL", params: [], nabl_status: true },
      physical_non_nabl: {
        discipline: "PHYSICAL",
        params: [],
        nabl_status: false,
      },
    };

    for (const sp of sampleParams) {
      const plain = sp.toJSON ? sp.toJSON() : sp;
      const paramId = String(plain.param_id);
      const discipline = plain.param?.discipline || "PHYSICAL";
      const is_nabl = !!plain.param?.is_nabl;

      if (discipline === "CHEMICAL") {
        if (is_nabl) classification.chemical_nabl.params.push(paramId);
        else classification.chemical_non_nabl.params.push(paramId);
      } else {
        if (is_nabl) classification.physical_nabl.params.push(paramId);
        else classification.physical_non_nabl.params.push(paramId);
      }
    }

    // Ensure job records exist or are updated
    for (const key of Object.keys(classification)) {
      const { params, nabl_status, discipline } = classification[key];
      if (!params.length) continue;

      const existingJob = await Jobs.findOne({
        where: { sample_id: sampleId, job_id: key },
        transaction,
      });

      const paramsJson = JSON.stringify(params);

      if (existingJob) {
        if (
          String(existingJob.params_json) !== paramsJson ||
          existingJob.nabl !== nabl_status ||
          existingJob.discipline !== discipline
        ) {
          await Jobs.update(
            { params_json: paramsJson, nabl: nabl_status, discipline },
            { where: { job_pk: existingJob.job_pk }, transaction },
          );
        }
      } else {
        await Jobs.create(
          {
            sample_id: sampleId,
            job_id: key,
            discipline,
            nabl: nabl_status,
            params_json: paramsJson,
          },
          { transaction },
        );
      }
    }
  };

  try {
    // destructure request body safely
    let {
      ref,
      project_name,
      subject,
      reporting_address,
      customer_id,
      selectedSamples,
      geotechnicalItems,
      transportation_fee,
      dor,
      letter,
      order_number,
      pn,
      selected_client_id,
      selectedGst,
      division,
      order_code,
      ndtItems,
      branch,
    } = req.body;

    // normalize arrays if sent as strings
    selectedSamples = safeParse(selectedSamples) || [];
    // console.log(selectedSamples[0].physicalParams,'sec879')
    geotechnicalItems = safeParse(geotechnicalItems) || [];
    console.log(
      "GT DEBUG >>> raw geotechnicalItems:",
      req.body.geotechnicalItems,
    );
    console.log("GT DEBUG >>> parsed geotechnicalItems:", geotechnicalItems);
    ndtItems = safeParse(ndtItems) || [];

    // file handling: keep reference to uploaded file (if any)
    const letterFile = req.file;
    let client_letter_location = letterFile || null;

    // fetch existing order to avoid overwriting important fields on update
    const existingOrder = await Orders.findByPk(orderId, { transaction: t });
    let finalBranch =
      branch !== undefined && branch !== null ? branch : existingOrder?.branch;

    // ✅ Only GT has location selection
    if (division !== "GT") {
      finalBranch = "VZG"; // LAB (and others) always Vizag
    }

    // Determine canonical order number to use across the function
    let finalOrderNumber =
      order_number && order_number !== "null"
        ? String(order_number)
        : existingOrder?.order_number
          ? String(existingOrder.order_number)
          : null;

    if (!finalOrderNumber) {
      if (division === "GT") {
        finalOrderNumber = order_code
          ? String(order_code)
          : String(Math.floor(1000000000 + Math.random() * 9000000000));
      } else if (division === "LAB") {
        finalOrderNumber = existingOrder?.order_number
          ? String(existingOrder.order_number)
          : order_code
            ? String(order_code)
            : null;
      } else {
        finalOrderNumber = order_code
          ? String(order_code)
          : existingOrder?.order_number
            ? String(existingOrder.order_number)
            : null;
      }
    }

    // If a new file is uploaded, delete old one and upload new
    if (req.file) {
      try {
        await deleteObjFromBkt(
          process.env.AWS_KDM_WORK_ORDER_LETTERS,
          `${orderId}-letter`,
        );
      } catch (err) {
        console.warn("deleteObjFromBkt failed:", err?.message || err);
      }
      client_letter_location = await uploadWorkOrderFileToS3(
        letterFile,
        orderId,
      );
    } else {
      client_letter_location = existingOrder ? existingOrder.letter : null;
    }

    // fetch customer details for discount etc.
    const customerDetails = await getCustomerInfoUsingID(customer_id, t);

    const orderDetails = {
      ref,
      project_name,
      subject,
      discount: customerDetails?.discount || 0,
      transportation_fee,
      // keep order_code separate; canonical order number is finalOrderNumber
      order_number: order_code,
      branch: finalBranch,
    };

    const pdfDetails = {
      isProforma: true,
      pdf_name: `proforma-invoice-${pn}.pdf`,
      previousOrderNumber: pn,
      pn,
    };

    // client information, if client selected
    let clientInformation = {};
    if (selected_client_id) {
      const clientDetails = await Client.findOne({
        where: { client_id: selected_client_id },
      });
      if (clientDetails) {
        const { reporting_name, reporting_address } =
          clientDetails.dataValues || {};
        clientInformation.reporting_name = reporting_name;
        clientInformation.reporting_address = reporting_address;
      }
    }

    // prepare bill data per division
    const billData = { orderDetails, customerDetails };
    if (division === "GT") {
      billData.geotechnicalItems = Array.isArray(geotechnicalItems)
        ? geotechnicalItems
        : [];
    } else if (division === "NDT") {
      billData.ndtItems = Array.isArray(ndtItems) ? ndtItems : [];
    } else {
      billData.selectedSamples = Array.isArray(selectedSamples)
        ? selectedSamples
        : [];
    }

    // generate proforma invoice based on division
    let proforma;
    if (division === "GT") {
      proforma = await generateGeotechProformaInvoice(
        billData,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
      );
    } else if (division === "NDT") {
      proforma = await generateNdtProformaInvoice(
        billData,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
      );
    } else {
      proforma = await generateProformaInvoice(
        billData,
        pdfDetails,
        dor,
        clientInformation,
        selectedGst,
      );
    }

    const { location: proformaLocation, totalAgg } = proforma || {};

    // sample_data to store in orders table (stringified clean)
    const sample_data_to_store =
      division === "GT"
        ? JSON.stringify(billData.geotechnicalItems || [])
        : division === "NDT"
          ? JSON.stringify(billData.ndtItems || [])
          : JSON.stringify(billData.selectedSamples || []);

    // read orderRecord & taxed order if present
    const orderRecord = existingOrder;

    let taxNumber = null;
    let taxConvertedDate = null;
    let convertedTaxRecord = false;
    if (orderRecord && orderRecord.tax_number) {
      const taxedOrderRecord = await TaxedOrders.findOne({
        where: { tax_number: orderRecord.tax_number },
        transaction: t,
      });
      if (taxedOrderRecord) {
        taxNumber = taxedOrderRecord.tax_number;
        taxConvertedDate = taxedOrderRecord.date;
        convertedTaxRecord = true;
      }
    }

    const ledgerKey =
      division === "GT"
        ? (order_code ?? finalOrderNumber)
        : (finalOrderNumber ?? order_code);

    if (ledgerKey) {
      await Ledger.destroy({
        where: { order_number: ledgerKey },
        transaction: t,
      });
    }

    if (ledgerKey) {
      await Ledger.create(
        {
          customer_id,
          ledger_date: dor,
          entries: [
            {
              pi: pn,
              debit: totalAgg,
              credit: null,
              vch_no: "-",
              remarks: "-",
              vch_type: "-",
              pi_amount: totalAgg,
              ti_amount: convertedTaxRecord ? totalAgg : "-",
              particulars: "-",
              mode_of_payment: "-",
            },
          ],
          order_number: ledgerKey,
          tax_number: taxNumber ? String(taxNumber) : "-",
          tax_converted_date: taxConvertedDate
            ? taxConvertedDate instanceof Date
              ? taxConvertedDate.toISOString()
              : String(taxConvertedDate)
            : "-",
        },
        { transaction: t },
      );
    }

    // Update orders table for GT / NDT
    if (division === "GT" || division === "NDT") {
      await Orders.update(
        {
          ref,
          gst: selectedGst,
          project_name,
          subject,
          reporting_address,
          customer_id,
          letter: client_letter_location,
          transportation_fee,
          proforma: proformaLocation,
          dor,
          amount: (totalAgg || 0) - (transportation_fee || 0),
          // canonical order_number usage: for NDT we may keep order_code; otherwise store finalOrderNumber
          order_number: division === "NDT" ? order_code : finalOrderNumber,
          division,
          order_code,
          pn,
          client_id: selected_client_id ? selected_client_id : null,
          sample_data: sample_data_to_store,
          branch: finalBranch,
        },
        { where: { order_id: orderId }, transaction: t },
      );
    }

    // -----------------------
    // LAB branch — handle samples & params
    // -----------------------
    if (division === "LAB" && finalOrderNumber) {
      // Build basket from selectedSamples (preserve original logic but normalized)
      // console.log(selectedSamples,'selectedSamples786')
      const basket = [];
      let globalAvailableCoreDetails = [];
      for (const eachSampleRaw of selectedSamples || []) {
        const eachSample = eachSampleRaw || {};
        // console.log(eachSample, "eachSampl345");

        // if (!eachSample.sample_id && (String(eachSample.sampleId) !== "62")) {
        //   eachSample.sample_id = uuidv4();
        // }

        if (String(eachSample.sampleId) === "62") {
          const clubId =
            eachSample.club_id ||
            (eachSample.clubId_list && eachSample.clubId_list[0]);
          const clubTestRecord = await ClubTests.findOne({
            where: { club_id: clubId },
            attributes: ["test_requirement"],
            transaction: t,
          });
          const testRequirement = clubTestRecord?.test_requirement;
          globalAvailableCoreDetails = testRequirement?.coreDetails || [];
          const coreDetails = testRequirement?.coreDetails || [];
          // console.log(coreDetails, "coreDetails654");
          const qty = coreDetails.length || 1;

          for (let i = 0; i < qty; i++) {
            const core = coreDetails[i];
            const sampleClone = {
              ...eachSample,
              club_id: clubId,
              sample_id: eachSample.sample_id ? eachSample.sample_id : uuidv4(),
            };

            const filteredParams = (eachSample.physicalParams || []).filter(
              (param) => {
                if (core?.nabl)
                  return String(param.paramId) === "20240725182402705";
                return String(param.paramId) === "20240725182338307";
              },
            );

            sampleClone.physicalParams = filteredParams.map((p) => ({
              ...p,
              isNabl: core?.nabl ? 1 : 0,
            }));

            basket.push(sampleClone);
          }
        } else if (
          String(eachSample.sampleId) === "85" ||
          String(eachSample.sampleId) === "172" ||
          String(eachSample.sampleId) === "156" ||
          String(eachSample.sampleId) === "155" ||
          String(eachSample.sampleId) === "120"
        ) {
          const baseSampleId = eachSample.sample_id || uuidv4();
          const clubId = eachSample.clubId_list?.[0];
          basket.push({
            ...eachSample,
            club_id: clubId,
            sample_id: baseSampleId,
          });
        } else if (eachSample.sample_id) {
          for (const clubId of eachSample.clubId_list || []) {
            basket.push({ ...eachSample, club_id: clubId, qty: 1 });
          }
        } else {
          for (const clubId of eachSample.clubId_list || []) {
            basket.push({
              ...eachSample,
              club_id: clubId,
              sample_id: uuidv4(),
              qty: 1,
              clubId_list: [],
            });
          }
        }

        // else {
        //   // If there's no sample_id, generate one here BEFORE looping

        // console.log(baseSampleId,'baseSampleId876')
        //   for (const clubId of eachSample.clubId_list || []) {
        //      const baseSampleId = eachSample.sample_id || uuidv4();
        //     basket.push({
        //       ...eachSample,
        //       club_id: clubId,
        //       // assign a fresh UUID for EACH loop iteration
        //       sample_id: baseSampleId,
        //     });
        //   }
        // }
      }
      // console.log(basket, "basky769");
      // Update orders table for LAB with generated basket sample data
      await Orders.update(
        {
          ref,
          gst: selectedGst,
          project_name,
          subject,
          reporting_address,
          customer_id,
          letter: client_letter_location,
          transportation_fee,
          proforma: proformaLocation,
          dor,
          amount: totalAgg || 0,
          order_number: division === "NDT" ? order_code : finalOrderNumber,
          division,
          order_code,
          pn,
          client_id: selected_client_id ? selected_client_id : null,
          // sample_data: JSON.stringify(basket),
          sample_data: JSON.stringify(selectedSamples),

          branch: finalBranch,
        },
        { where: { order_id: orderId }, transaction: t },
      );

      // Use your existing generator but pass finalOrderNumber
      const formattedSamples = generateSampleCodes(
        basket,
        finalOrderNumber,
        dor,
      );

      // We'll collect all sample ids to later delete removed ones
      const allSampleIds = [];
      let hasChemical = false;
      let hasPhysical = false;

      // Process each formatted sample
      for (const eachSample of formattedSamples) {
        const {
          sampleId,
          chemicalParams = [],
          physicalParams = [],
          sample_code,
          club_id,
          due_date,
          sample_id,
        } = eachSample;

        console.log(eachSample, "eachSample654");

        if ((chemicalParams || []).length) hasChemical = true;
        if ((physicalParams || []).length) hasPhysical = true;

        const clubTestRecord = await ClubTests.findOne({
          where: { club_id },
          attributes: ["test_requirement"],
          transaction: t,
        });

        const newId =
          sample_id && String(sample_id).trim() !== ""
            ? String(sample_id)
            : uuidv4();
        allSampleIds.push(newId);

        // assign unique coreDetails if sampleId === "62"
        let sampleTestReq = clubTestRecord
          ? clubTestRecord.test_requirement
          : null;
        if (
          String(sampleId) === "62" &&
          (physicalParams || []).length > 0 &&
          sampleTestReq
        ) {
          const assignedCoreDetails = [];
          for (const param of physicalParams) {
            if (!globalAvailableCoreDetails.length) break;
            const isNablParam =
              param.paramId === "20240725182402705" ||
              param.paramId === 20240725182402705;
            const coreIndex = globalAvailableCoreDetails.findIndex(
              (core) => core.nabl === isNablParam,
            );
            if (coreIndex !== -1) {
              const assignedCore = globalAvailableCoreDetails[coreIndex];
              assignedCoreDetails.push(assignedCore);
              param.assignedCore = assignedCore;
              globalAvailableCoreDetails.splice(coreIndex, 1);
            }
          }
          sampleTestReq = {
            ...sampleTestReq,
            coreDetails: assignedCoreDetails,
          };
        }

        const sampleRecord = {
          order_id: orderId,
          product_id: sampleId,
          sample_code,
          sample_id: newId,
          club_id,
          duedate: due_date,
          test_req: sampleTestReq,
          registered: true,
        };

        // upsert SampleMaterials
        const existingSample = await SampleMaterials.findOne({
          where: { sample_id: newId },
          transaction: t,
        });
        console.log("🧾 EXISTING test_req IN DB =====================");
        console.log(existingSample?.test_req);
        if (existingSample) {
          await SampleMaterials.update(sampleRecord, {
            where: { sample_id: newId },
            transaction: t,
          });
        } else {
          await SampleMaterials.create(sampleRecord, { transaction: t });
        }

        // update sample_material_fields linking club -> sample
        await SampleMaterialFields.update(
          { sample_id: newId },
          { where: { club_id }, transaction: t },
        );

        // prepare bulk upsert array for sample params
        const paramsToUpsert = [];

        for (const eachParamRaw of [
          ...(chemicalParams || []),
          ...(physicalParams || []),
        ]) {
          const eachParam = normalizeSampleParamObject(eachParamRaw);
          const params_info = normalizeParams(
            eachParam.params || eachParam.params_info || [],
          );

          paramsToUpsert.push({
            sample_id: newId,
            param_id: String(eachParam.paramId),
            params_info,
            param_price: eachParam.price || 0,
          });
        }

        if (paramsToUpsert.length) {
          // 1) Get existing params
          const existingParams = await SampleParams.findAll({
            where: { sample_id: newId },
            transaction: t,
          });

          // 2) If exists → delete all old params
          if (existingParams.length > 0) {
            await SampleParams.destroy({
              where: { sample_id: newId },
              transaction: t,
            });
          }

          // 3) Insert new params fresh
          await SampleParams.bulkCreate(paramsToUpsert, { transaction: t });
        }

        // classify & ensure jobs are created/updated correctly
        await classifySampleParamsAndUpdateDBwithoutLosingOld2(newId, t);
      } // end for formattedSamples

      // Delete removed samples & their params
      const existingSamples = await SampleMaterials.findAll({
        where: { order_id: orderId },
        attributes: ["sample_id"],
        transaction: t,
      });
      const existingSampleIds = existingSamples.map((s) => s.sample_id);
      const toDeleteSampleIds = existingSampleIds.filter(
        (id) => !allSampleIds.includes(id),
      );

      if (toDeleteSampleIds.length) {
        // 1️⃣ Delete Jobs first (child table)
        await Jobs.destroy({
          where: { sample_id: toDeleteSampleIds },
          transaction: t,
        });

        // 2️⃣ Delete Sample Params
        await SampleParams.destroy({
          where: { sample_id: toDeleteSampleIds },
          transaction: t,
        });

        // 3️⃣ Delete Sample Materials
        await SampleMaterials.destroy({
          where: { sample_id: toDeleteSampleIds },
          transaction: t,
        });
      }

      // try {
      //   await sendWhatsAppMessage(
      //     customerDetails.mobile,
      //     `Hi ${customerDetails.billing_name}, We’re pleased to inform you that your order has been successfully placed.Your proforma invoice for WO:${order_number} is ready. Download here: ${s3Link}\n\n${reportLines}\n\nThank you for entrusting KDM Engineers India (Pvt) Ltd with your testing requirements.`,
      //     process.env.CALLMEBOT_API_KEY,
      //   );
      //   console.log("Whatsapp msg sent successfully");
      // } catch (wErr) {
      //   console.error("❌ Whatsapp msg sending failed:", wErr);
      // }

      // HOD notifications (use finalOrderNumber)
      // NOTE: fixed logic: chemical -> chemical HOD and message mentions chemical; physical -> mechanical HOD (physical) and message mentions physical.
      if (hasChemical) {
        // chemical parameters -> notify chemical HOD (LABORATORY_CHEMICAL)
        const chemHod = await Employee.findOne({
          where: {
            access_key: "KDM_HOD_TOKEN",
            department: "LABORATORY_CHEMICAL",
          },
          transaction: t,
        });
        if (chemHod) {
          await Notification.create(
            {
              receiver_emp_id: chemHod.emp_id,
              message: `New order WO:${finalOrderNumber} registered with chemical parameters. Please review and assign.`,
              order_number: finalOrderNumber,
              acknowledge: false,
            },
            { transaction: t },
          );
        }
      }

      if (hasPhysical) {
        // physical parameters -> notify mechanical HOD (LABORATORY_MECHANICAL)
        const mechHod = await Employee.findOne({
          where: {
            access_key: "KDM_HOD_TOKEN",
            department: "LABORATORY_MECHANICAL",
          },
          transaction: t,
        });
        if (mechHod) {
          await Notification.create(
            {
              receiver_emp_id: mechHod.emp_id,
              message: `New order WO:${finalOrderNumber} registered with physical parameters. Please review and assign.`,
              order_number: finalOrderNumber,
              acknowledge: false,
            },
            { transaction: t },
          );
        }
      }
    } // end LAB branch

    // GT branch: optional processing of geotechnicalItems can be added here if you maintain separate table(s)

    // commit and return
    await t.commit();
    return res.status(200).json({
      message: "Order registration updated successfully",
      data: {
        orderId,
        project_name,
        subject,
        registration_done: true,
        mode: "OFFLINE",
      },
    });
  } catch (err) {
    console.error("updateOfflineOrder error:", err);
    await t.rollback();

    // more robust unique constraint check
    if (
      err &&
      (err.name === "SequelizeUniqueConstraintError" ||
        err.original?.errno === 1062)
    ) {
      return res.status(400).json({ message: "Duplicate Entry, please check" });
    }

    return res.status(500).json({
      message: "Internal server error, please check",
      error: err?.message || err,
    });
    return res.status(500).json({
      message: "Internal server error, please check",
      error: err?.message || err,
    });
  }
};

// const updateOfflineOrder = async (req, res) => {
//   const t = await sequelize.transaction();
//   const orderId = req.params.orderId;

//   const safeParse = (value) => {
//     if (value == null) return value;
//     if (typeof value === "object") return value;
//     try {
//       return JSON.parse(String(value));
//     } catch (e) {
//       // fallback: try to sanitize newline characters and parse again
//       try {
//         const cleaned = String(value)
//           .replace(/\r?\n/g, " ")
//           .replace(/\s+/g, " ")
//           .trim();
//         return JSON.parse(cleaned);
//       } catch (ee) {
//         return String(value);
//       }
//     }
//   };

//   const normalizeParams = (params) => {
//     if (params == null) return null;
//     if (typeof params === "object") {
//       try {
//         return JSON.stringify(params);
//       } catch (e) {
//         // fallback
//         return String(params);
//       }
//     }
//     // string
//     const cleaned = String(params)
//       .replace(/\r?\n/g, " ")
//       .replace(/\t/g, " ")
//       .replace(/\s+/g, " ")
//       .trim();
//     return cleaned;
//   };

//   const normalizeSampleParamObject = (p) => {
//     return {
//       paramId: p?.paramId ? String(p.paramId) : undefined,
//       price: p?.price != null ? Number(p.price) : undefined,
//       params: p?.params ? p.params : p?.params_info ? p.params_info : null,
//       isNabl: p?.isNabl === "1" || p?.isNabl === 1 || p?.isNabl === true,
//       ...(p || {}),
//     };
//   };

//   const classifySampleParamsAndUpdateDBwithoutLosingOld2 = async (
//     sampleId,
//     transaction
//   ) => {
//     const sampleParams = await SampleParams.findAll({
//       where: { sample_id: sampleId },
//       include: [
//         {
//           model: Params,
//           as: "param",
//           attributes: ["discipline", "is_nabl"],
//         },
//       ],
//       transaction,
//     });

//     const classification = {
//       chemical_nabl: { discipline: "CHEMICAL", params: [], nabl_status: true },
//       chemical_non_nabl: {
//         discipline: "CHEMICAL",
//         params: [],
//         nabl_status: false,
//       },
//       physical_nabl: { discipline: "PHYSICAL", params: [], nabl_status: true },
//       physical_non_nabl: {
//         discipline: "PHYSICAL",
//         params: [],
//         nabl_status: false,
//       },
//     };

//     for (const sp of sampleParams) {
//       const plain = sp.toJSON ? sp.toJSON() : sp;
//       const paramId = String(plain.param_id);
//       const discipline = plain.param?.discipline || "PHYSICAL";
//       const is_nabl = !!plain.param?.is_nabl;

//       if (discipline === "CHEMICAL") {
//         if (is_nabl) classification.chemical_nabl.params.push(paramId);
//         else classification.chemical_non_nabl.params.push(paramId);
//       } else {
//         if (is_nabl) classification.physical_nabl.params.push(paramId);
//         else classification.physical_non_nabl.params.push(paramId);
//       }
//     }

//     // For each classification key ensure job exists or update existing job
//     for (const key of Object.keys(classification)) {
//       const { params, nabl_status, discipline } = classification[key];
//       if (!params.length) continue;
//       console.log(sampleId, "sampleId78");
//       // find job by both sample_id and job_id (prevents duplicates)
//       const existingJob = await Jobs.findOne({
//         where: { sample_id: sampleId, job_id: key },
//         transaction,
//       });
//       console.log(classification, "classification87");
//       console.log(existingJob, "existingJob7259");

//       const paramsJson = JSON.stringify(params);

//       if (existingJob) {
//         if (
//           String(existingJob.params_json) !== paramsJson ||
//           existingJob.nabl !== nabl_status ||
//           existingJob.discipline !== discipline
//         ) {
//           await Jobs.update(
//             { params_json: paramsJson, nabl: nabl_status, discipline },
//             { where: { job_pk: existingJob.job_pk }, transaction }
//           );
//         }
//       } else {
//         // create new job record
//         await Jobs.create(
//           {
//             sample_id: sampleId,
//             job_id: key,
//             discipline,
//             nabl: nabl_status,
//             params_json: paramsJson,
//           },
//           { transaction }
//         );
//       }
//     }
//   };

//   try {
//     // destructure request body safely
//     let {
//       ref,
//       project_name,
//       subject,
//       reporting_address,
//       customer_id,
//       selectedSamples,
//       geotechnicalItems,
//       transportation_fee,
//       dor,
//       letter,
//       order_number,
//       pn,
//       selected_client_id,
//       selectedGst,
//       division,
//       order_code,
//       ndtItems,
//       branch,
//     } = req.body;
//     console.log(selectedSamples, "itsCame43");
//     // normalize arrays if sent as strings
//     selectedSamples = safeParse(selectedSamples) || [];
//     geotechnicalItems = safeParse(geotechnicalItems) || [];
//     ndtItems = safeParse(ndtItems) || [];

//     // file handling: keep reference to uploaded file (if any)
//     const letterFile = req.file;
//     let client_letter_location = letterFile || null;

//     // fetch existing order to avoid overwriting important fields on update
//     const existingOrder = await Orders.findByPk(orderId, { transaction: t });

//     // Determine canonical order number to use across the function
//     let finalOrderNumber =
//       order_number && order_number !== "null"
//         ? String(order_number)
//         : existingOrder?.order_number
//           ? String(existingOrder.order_number)
//           : null;

//     if (!finalOrderNumber) {
//       if (division === "GT") {
//         finalOrderNumber = order_code
//           ? String(order_code)
//           : String(Math.floor(1000000000 + Math.random() * 9000000000));
//       } else if (division === "LAB") {
//         finalOrderNumber = existingOrder?.order_number
//           ? String(existingOrder.order_number)
//           : order_code
//             ? String(order_code)
//             : null;
//       } else {
//         finalOrderNumber = order_code
//           ? String(order_code)
//           : existingOrder?.order_number
//             ? String(existingOrder.order_number)
//             : null;
//       }
//     }

//     if (req.file) {
//       try {
//         await deleteObjFromBkt(
//           process.env.AWS_KDM_WORK_ORDER_LETTERS,
//           `${orderId}-letter`
//         );
//       } catch (err) {
//         console.warn("deleteObjFromBkt failed:", err?.message || err);
//       }
//       client_letter_location = await uploadWorkOrderFileToS3(
//         letterFile,
//         orderId
//       );
//     } else {
//       client_letter_location = existingOrder ? existingOrder.letter : null;
//     }

//     // fetch customer details for discount etc.
//     const customerDetails = await getCustomerInfoUsingID(customer_id, t);

//     const orderDetails = {
//       ref,
//       project_name,
//       subject,
//       discount: customerDetails?.discount || 0,
//       transportation_fee,
//       order_number: order_code,
//     };

//     const pdfDetails = {
//       isProforma: true,
//       pdf_name: `proforma-invoice-${pn}.pdf`,
//       previousOrderNumber: pn,
//       pn,
//     };

//     // client information, if client selected
//     let clientInformation = {};
//     if (selected_client_id) {
//       const clientDetails = await Client.findOne({
//         where: { client_id: selected_client_id },
//       });
//       if (clientDetails) {
//         const { reporting_name, reporting_address } =
//           clientDetails.dataValues || {};
//         clientInformation.reporting_name = reporting_name;
//         clientInformation.reporting_address = reporting_address;
//       }
//     }

//     // prepare bill data per division
//     const billData = { orderDetails, customerDetails };
//     if (division === "GT") {
//       billData.geotechnicalItems = Array.isArray(geotechnicalItems)
//         ? geotechnicalItems
//         : [];
//     } else if (division === "NDT") {
//       billData.ndtItems = Array.isArray(ndtItems) ? ndtItems : [];
//     } else {
//       billData.selectedSamples = Array.isArray(selectedSamples)
//         ? selectedSamples
//         : [];
//     }

//     // generate proforma invoice based on division
//     let proforma;
//     if (division === "GT") {
//       proforma = await generateGeotechProformaInvoice(
//         billData,
//         pdfDetails,
//         dor,
//         clientInformation,
//         selectedGst
//       );
//     } else if (division === "NDT") {
//       proforma = await generateNdtProformaInvoice(
//         billData,
//         pdfDetails,
//         dor,
//         clientInformation,
//         selectedGst
//       );
//     } else {
//       proforma = await generateProformaInvoice(
//         billData,
//         pdfDetails,
//         dor,
//         clientInformation,
//         selectedGst
//       );
//     }

//     const { location: proformaLocation, totalAgg } = proforma || {};

//     // sample_data to store in orders table (stringified abs clean)
//     const sample_data_to_store =
//       division === "GT"
//         ? JSON.stringify(billData.geotechnicalItems || [])
//         : division === "NDT"
//           ? JSON.stringify(billData.ndtItems || [])
//           : JSON.stringify(billData.selectedSamples || []);

//     // read orderRecord & taxed order if present
//     const orderRecord = await Orders.findByPk(orderId, { transaction: t });

//     let taxNumber = null;
//     let taxConvertedDate = null;
//     let convertedTaxRecord = false;
//     if (orderRecord && orderRecord.tax_number) {
//       const taxedOrderRecord = await TaxedOrders.findOne({
//         where: { tax_number: orderRecord.tax_number },
//         transaction: t,
//       });
//       if (taxedOrderRecord) {
//         taxNumber = taxedOrderRecord.tax_number;
//         taxConvertedDate = taxedOrderRecord.date;
//         convertedTaxRecord = true;
//       }
//     }

//     const ledgerKey = finalOrderNumber || order_code || null;
//     if (ledgerKey) {
//       const existingLedger = await Ledger.findOne({
//         where: { order_number: ledgerKey },
//         transaction: t,
//       });
//       const ledgerData = {
//         customer_id,
//         ledger_date: dor,
//         entries: [
//           {
//             pi: pn,
//             debit: totalAgg,
//             credit: null,
//             vch_no: "-",
//             remarks: "-",
//             vch_type: "-",
//             pi_amount: totalAgg,
//             ti_amount: convertedTaxRecord ? totalAgg : "-",
//             particulars: "-",
//             mode_of_payment: "-",
//           },
//         ],
//         order_number: ledgerKey,
//         tax_number: taxNumber ? String(taxNumber) : "-",
//         tax_converted_date: taxConvertedDate
//           ? taxConvertedDate instanceof Date
//             ? taxConvertedDate.toISOString()
//             : String(taxConvertedDate)
//           : "-",
//       };

//       if (existingLedger) {
//         await Ledger.update(ledgerData, {
//           where: { order_number: ledgerKey },
//           transaction: t,
//         });
//       } else {
//         await Ledger.create(ledgerData, { transaction: t });
//       }
//     }

//     if (division === "GT" || division === 'NDT'){
//     // Update orders table
//     await Orders.update(
//       {
//         ref,
//         gst: selectedGst,
//         project_name,
//         subject,
//         reporting_address,
//         customer_id,
//         letter: client_letter_location,
//         transportation_fee,
//         proforma: proformaLocation,
//         dor,
//         amount: (totalAgg || 0) - (transportation_fee || 0),
//         // canonical order_number usage: for NDT we may keep order_code; otherwise store finalOrderNumber
//         order_number: division === "NDT" ? order_code : finalOrderNumber,
//         division,
//         order_code,
//         pn,
//         client_id: selected_client_id ? selected_client_id : null,
//         sample_data: sample_data_to_store,
//         branch,
//       },
//       { where: { order_id: orderId }, transaction: t }
//     );
//     }

//     // -----------------------
//     // LAB branch — handle samples & params
//     // -----------------------
//     if (division === "LAB" && finalOrderNumber) {
//       // Build basket from selectedSamples (preserve original logic but normalized)
//       const basket = [];
//       let globalAvailableCoreDetails = [];
//       console.log(selectedSamples, "selectedSamples87");
//       for (const eachSampleRaw of selectedSamples || []) {
//         const eachSample = eachSampleRaw || {};
// console.log(eachSample,'eaicher341')
//           if (!eachSample.sample_id) {
// console.log('trig623')
//     eachSample.sample_id = uuidv4();
//   }

//         console.log(eachSample,'eaicher349')
//         if (String(eachSample.sampleId) === "62") {
//           console.log(eachSample,'eachSample765')
//           const clubId = eachSample.club_id || (eachSample.clubId_list && eachSample.clubId_list[0]);
//           const clubTestRecord = await ClubTests.findOne({
//             where: { club_id: clubId },
//             attributes: ["test_requirement"],
//             transaction: t,
//           });
//           const testRequirement = clubTestRecord?.test_requirement;
//           globalAvailableCoreDetails = testRequirement?.coreDetails || [];
//           const coreDetails = testRequirement?.coreDetails || [];
//           const qty = coreDetails.length || 1;

//           for (let i = 0; i < qty; i++) {
//             const core = coreDetails[i];
//             const sampleClone = {
//               ...eachSample,
//               club_id: clubId,
//               sample_id: eachSample.sample_id ? eachSample.sample_id : uuidv4(),

//             };

//             const filteredParams = (eachSample.physicalParams || []).filter(
//               (param) => {
//                 if (core?.nabl)
//                   return String(param.paramId) === "20240725182402705";
//                 return String(param.paramId) === "20240725182716784";
//               }
//             );

//             sampleClone.physicalParams = filteredParams.map((p) => ({
//               ...p,
//               isNabl: core?.nabl ? 1 : 0,
//             }));

//             basket.push(sampleClone);
//           }
//         } else if (String(eachSample.sampleId) === "85") {
//           const clubId = eachSample.clubId_list?.[0];
//           basket.push({ ...eachSample, club_id: clubId });
//         } else {
//           for (const clubId of eachSample.clubId_list || []) {
//             basket.push({ ...eachSample, club_id: clubId });
//           }
//         }
//       }

//  if (division === 'LAB'){
//     // Update orders table
//     await Orders.update(
//       {
//         ref,
//         gst: selectedGst,
//         project_name,
//         subject,
//         reporting_address,
//         customer_id,
//         letter: client_letter_location,
//         transportation_fee,
//         proforma: proformaLocation,
//         dor,
//         amount: (totalAgg || 0) - (transportation_fee || 0),
//         // canonical order_number usage: for NDT we may keep order_code; otherwise store finalOrderNumber
//         order_number: division === "NDT" ? order_code : finalOrderNumber,
//         division,
//         order_code,
//         pn,
//         client_id: selected_client_id ? selected_client_id : null,
//         sample_data: JSON.stringify(basket),
//         branch,
//       },
//       { where: { order_id: orderId }, transaction: t }
//     );
//     }

// console.log(basket,'backy67s')
//       // Use your existing generator but pass finalOrderNumber
//       const formattedSamples = generateSampleCodes(
//         basket,
//         finalOrderNumber,
//         dor
//       );

//       // We'll collect all sample ids to later delete removed ones
//       const allSampleIds = [];
//       let hasChemical = false;
//       let hasPhysical = false;

//       // Process each formatted sample
//       for (const eachSample of formattedSamples) {
//         const {
//           sampleId,
//           chemicalParams = [],
//           physicalParams = [],
//           sample_code,
//           club_id,
//           due_date,
//           sample_id,
//         } = eachSample;

//         if ((chemicalParams || []).length) hasChemical = true;
//         if ((physicalParams || []).length) hasPhysical = true;

//         const clubTestRecord = await ClubTests.findOne({
//           where: { club_id },
//           attributes: ["test_requirement"],
//           transaction: t,
//         });
//         console.log(sample_id, "checkSid");
//         const newId =
//           sample_id && String(sample_id).trim() !== ""
//             ? String(sample_id)
//             : uuidv4();
//         allSampleIds.push(newId);
//         console.log(newId, "newId723");
//         // assign unique coreDetails if sampleId === "62"
//         let sampleTestReq = clubTestRecord
//           ? clubTestRecord.test_requirement
//           : null;
//         if (
//           String(sampleId) === "62" &&
//           (physicalParams || []).length > 0 &&
//           sampleTestReq
//         ) {
//           const assignedCoreDetails = [];
//           for (const param of physicalParams) {
//             if (!globalAvailableCoreDetails.length) break;
//             const isNablParam =
//               param.paramId === "20240725182402705" ||
//               param.paramId === 20240725182402705;
//             const coreIndex = globalAvailableCoreDetails.findIndex(
//               (core) => core.nabl === isNablParam
//             );
//             if (coreIndex !== -1) {
//               const assignedCore = globalAvailableCoreDetails[coreIndex];
//               assignedCoreDetails.push(assignedCore);
//               param.assignedCore = assignedCore;
//               globalAvailableCoreDetails.splice(coreIndex, 1);
//             }
//           }
//           sampleTestReq = {
//             ...sampleTestReq,
//             coreDetails: assignedCoreDetails,
//           };
//         }

//         const sampleRecord = {
//           order_id: orderId,
//           product_id: sampleId,
//           sample_code,
//           sample_id: newId,
//           club_id,
//           duedate: due_date,
//           test_req: sampleTestReq,
//           registered: true,
//         };

//         // upsert SampleMaterials (Sequelize upsert if supported else findOne+update/create)
//         const existingSample = await SampleMaterials.findOne({
//           where: { sample_id: newId },
//           transaction: t,
//         });
//         if (existingSample) {
//           await SampleMaterials.update(sampleRecord, {
//             where: { sample_id: newId },
//             transaction: t,
//           });
//         } else {
//           await SampleMaterials.create(sampleRecord, { transaction: t });
//         }

//         // update sample_material_fields linking club -> sample
//         await SampleMaterialFields.update(
//           { sample_id: newId },
//           { where: { club_id }, transaction: t }
//         );

//         // prepare bulk upsert array for sample params
//         const paramsToUpsert = [];

//         for (const eachParamRaw of [
//           ...(chemicalParams || []),
//           ...(physicalParams || []),
//         ]) {
//           console.log(eachParamRaw, "eachParamRaw762");
//           const eachParam = normalizeSampleParamObject(eachParamRaw);
//           // normalize params_info (stringify or cleaned string)
//           const params_info = normalizeParams(
//             eachParam.params || eachParam.params_info || []
//           );

//           paramsToUpsert.push({
//             sample_id: newId,
//             param_id: String(eachParam.paramId),
//             params_info,
//             param_price: eachParam.price || 0,
//           });
//         }
//         console.log(paramsToUpsert, "paramsToUpsert675");
//         if (paramsToUpsert.length) {
//           // 1) Check if records exist for this sample_id
//           const existingParams = await SampleParams.findAll({
//             where: { sample_id: newId },
//             transaction: t,
//           });

//           // 2) If exists → delete all old params
//           if (existingParams.length > 0) {
//             await SampleParams.destroy({
//               where: { sample_id: newId },
//               transaction: t,
//             });
//           }

//           // 3) Insert new params fresh
//           await SampleParams.bulkCreate(paramsToUpsert, { transaction: t });
//         }

//         // classify & ensure jobs are created/updated correctly
//         await classifySampleParamsAndUpdateDBwithoutLosingOld2(newId, t);
//       } // end for formattedSamples

//       // Delete removed samples & their params
//       const existingSamples = await SampleMaterials.findAll({
//         where: { order_id: orderId },
//         attributes: ["sample_id"],
//         transaction: t,
//       });
//       const existingSampleIds = existingSamples.map((s) => s.sample_id);
//       const toDeleteSampleIds = existingSampleIds.filter(
//         (id) => !allSampleIds.includes(id)
//       );
//       if (toDeleteSampleIds.length) {
//         await SampleMaterials.destroy({
//           where: { sample_id: toDeleteSampleIds },
//           transaction: t,
//         });
//         await SampleParams.destroy({
//           where: { sample_id: toDeleteSampleIds },
//           transaction: t,
//         });
//       }

//       // HOD notifications (use finalOrderNumber)
//       if (hasChemical) {
//         const mechHod = await Employee.findOne({
//           where: {
//             access_key: "KDM_HOD_TOKEN",
//             department: "LABORATORY_MECHANICAL",
//           },
//           transaction: t,
//         });
//         if (mechHod) {
//           await Notification.create(
//             {
//               receiver_emp_id: mechHod.emp_id,
//               message: `New order WO:${finalOrderNumber} registered with physical parameters. Please review and assign.`,
//               order_number: finalOrderNumber,
//               acknowledge: false,
//             },
//             { transaction: t }
//           );
//         }
//       }

//       if (hasPhysical) {
//         const chemHod = await Employee.findOne({
//           where: {
//             access_key: "KDM_HOD_TOKEN",
//             department: "LABORATORY_CHEMICAL",
//           },
//           transaction: t,
//         });
//         if (chemHod) {
//           await Notification.create(
//             {
//               receiver_emp_id: chemHod.emp_id,
//               message: `New order WO:${finalOrderNumber} registered with chemical parameters. Please review and assign.`,
//               order_number: finalOrderNumber,
//               acknowledge: false,
//             },
//             { transaction: t }
//           );
//         }
//       }
//     } // end LAB branch

//     // GT branch: optional processing of geotechnicalItems can be added here if you maintain separate table(s)

//     // commit and return
//     await t.commit();
//     return res.status(200).json({
//       message: "Order registration updated successfully",
//       data: {
//         orderId,
//         project_name,
//         subject,
//         registration_done: true,
//         mode: "OFFLINE",
//       },
//     });
//   } catch (err) {
//     console.error("updateOfflineOrder error:", err);
//     await t.rollback();

//     // more robust unique constraint check
//     if (
//       err &&
//       (err.name === "SequelizeUniqueConstraintError" ||
//         err.original?.errno === 1062)
//     ) {
//       return res.status(400).json({ message: "Duplicate Entry, please check" });
//     }

//     return res
//       .status(500)
//       .json({
//         message: "Internal server error, please check",
//         error: err?.message || err,
//       });
//   }
// };

const getAllOrders = async (req, res) => {
  const { data } = req.query;

  // Build where clause dynamically based on division type
  const whereClause =
    data === "LAB"
      ? { division: { [Op.or]: [null, "LAB"] } } // LAB + NULL
      : data === "GT"
        ? { division: "GT" }
        : data === "NDT"
          ? { division: "NDT" }
          : {}; // In case data is not provided, fetch all

  const t = await sequelize.transaction();

  try {
    const ordersList = await Orders.findAll({
      where: whereClause,
      order: [["order_number", "ASC"]],
      attributes: [
        "created_at",
        "order_id",
        "proforma",
        "letter",
        "converted_to_tax",
        "dor",

        "ref",
        "tax_number",
        "order_number",
        "order_code",
        "division",
        [
          fn(
            "CONCAT",
            col("project_name"),
            " (",
            col("pn"),
            " / ",
            col("order_number"),
            ")",
          ),
          "project_name",
        ],

        // ✅ GET FILE FROM taxed_orders USING SUBQUERY
        [
          literal(`(
            SELECT file
            FROM taxed_orders
            WHERE taxed_orders.tax_number = Orders.tax_number
            LIMIT 1
          )`),
          "tax_file",
        ],
      ],
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["reporting_name", "billing_name", "reporting_address"],
          required: false,
        },
      ],
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({ data: ordersList });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllOrdersRevenue = async (req, res) => {
  const { data } = req.query; // data = '2025-2026'
  // console.log(data, "fy76");

  // Start and end dates for the financial year
  const [startYear, endYear] = data.split("-").map(Number);
  const startDate = new Date(`${startYear}-04-01`); // 1st April of start year
  const endDate = new Date(`${endYear}-03-31`); // 31st March of next year

  const t = await sequelize.transaction();

  try {
    const ordersList = await Orders.findAll({
      where: {
        dor: {
          [Op.between]: [startDate, endDate], // Filter by DOR between FY range
        },
        // division: {
        //   [Op.in]: ["LAB", "GT", "NDT"], // Include all three divisions
        // },
      },
      attributes: ["division", "amount", "dor"],
      order: [["dor", "ASC"]],
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({ data: ordersList });
  } catch (error) {
    await t.rollback();
    console.error("Error fetching FY revenue data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAllOrdersHighNums = async (req, res) => {
  const { data, dor } = req.query; // data = "LAB" | "GT" | "NDT", dor = "2025-10-28"

  try {
    // ✅ Financial Year Logic
    const orderDate = dor ? new Date(dor) : new Date();
    const year = orderDate.getFullYear();
    const month = orderDate.getMonth() + 1;
    const fyStartYear = month >= 4 ? year : year - 1;

    const fyStartDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // April 1
    const fyEndDate = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // March 31 next year

    // ✅ Find latest PN only in this financial year
    const latestOrder = await Orders.findOne({
      where: {
        dor: { [Op.between]: [fyStartDate, fyEndDate] },
      },
      order: [["pn", "DESC"]],
      attributes: ["pn"],
    });

    const nextPn = (latestOrder?.pn || 0) + 1;

    // ✅ Division-specific logic
    if (data === "GT") {
      const latestGTOrder = await Orders.findOne({
        where: {
          division: "GT",
          order_code: { [Op.ne]: null },
        },
        // ✅ Sort numerically by digits after 'GT'
        order: [
          [
            sequelize.literal("CAST(SUBSTRING(order_code, 3) AS UNSIGNED)"),
            "DESC",
          ],
        ],
        attributes: ["order_code"],
      });

      let nextOrderCode = "GT1";
      if (latestGTOrder?.order_code) {
        const match = latestGTOrder.order_code.match(/GT(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          nextOrderCode = `GT${num + 1}`;
        }
      }

      return res.status(200).json({
        division: "GT",
        nextOrderCode,
        nextPn,
      });
    }

    if (data === "LAB" || data === "NDT") {
      const latestLABOrder = await Orders.findOne({
        where: {
          division: { [Op.or]: ["LAB", "NDT"] },
          order_number: { [Op.ne]: null },
        },
        order: [["order_number", "DESC"]],
        attributes: ["order_number"],
      });

      const nextOrderNumber = (latestLABOrder?.order_number || 0) + 1;

      return res.status(200).json({
        division: data, // returns the actual division
        nextOrderNumber,
        nextPn,
      });
    }

    return res.status(200).json({ nextPn });
  } catch (error) {
    console.error("Error fetching highest numbers:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// const getAllOrders = async (req, res) => {
//   const { data } = req.query;
//   // console.log(data,'dib564')
//   const whereClause =
//     data === "LAB"
//       ? { division: { [Op.or]: [null, "LAB"] } } // LAB + NULL
//       : { division: "GT" };
//   const t = await sequelize.transaction();
//   try {
//     const ordersList = await Orders.findAll({
//       where: whereClause,

//       order: [["order_number", "ASC"]],
//       attributes: [
//         "created_at",
//         "order_id",
//         "proforma",
//         "letter",
//         "converted_to_tax",
//         "dor",
//         "ref",
//         "tax_number",
//         "order_number",
//         "order_code",
//         "division",
//         [
//           fn(
//             "CONCAT",
//             col("project_name"),
//             " (",
//             col("pn"),
//             " / ",
//             col("order_number"),
//             ")"
//           ),
//           "project_name",
//         ],
//       ],
//       include: [
//         {
//           model: Customers,
//           as: "customer", // <-- Must match the alias in association
//           attributes: ["reporting_name", "billing_name"],
//           required: false,
//         },
//       ],

//       transaction: t, // ✅ Move transaction inside main object
//     });

//     await t.commit();
//     return res.status(200).json({ data: ordersList });
//   } catch (error) {
//     await t.rollback();
//     console.error(error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

// const getAllOrdersHighNums = async (req, res) => {
//   const { data, dor } = req.query; // data = "LAB" or "GT", dor = "2025-10-28"

//   try {
//     // ✅ Financial Year Logic
//     const orderDate = dor ? new Date(dor) : new Date();
//     const year = orderDate.getFullYear();
//     const month = orderDate.getMonth() + 1;
//     const fyStartYear = month >= 4 ? year : year - 1;

//     const fyStartDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // April 1
//     const fyEndDate = new Date(fyStartYear + 1, 2, 31, 23, 59, 59); // March 31 next year

//     // ✅ Find latest PN only in this financial year
//     const latestOrder = await Orders.findOne({
//       where: {
//         dor: { [Op.between]: [fyStartDate, fyEndDate] },
//       },
//       order: [["pn", "DESC"]],
//       attributes: ["pn"],
//     });

//     const nextPn = (latestOrder?.pn || 0) + 1;

//     // ✅ Division-specific logic (unchanged)
//     if (data === "GT") {
//       const latestGTOrder = await Orders.findOne({
//         where: { division: "GT", order_code: { [Op.ne]: null } },
//         order: [["created_at", "DESC"]],
//         attributes: ["order_code"],
//       });
// console.log(latestGTOrder,'9y7')
//       let nextOrderCode = "GT1";
//       if (latestGTOrder?.order_code) {
//         const match = latestGTOrder.order_code.match(/GT(\d+)/);
//         if (match) {
//           const num = parseInt(match[1], 10);
//           nextOrderCode = `GT${num + 1}`;
//         }
//       }

//       return res.status(200).json({
//         division: "GT",
//         nextOrderCode,
//         nextPn,
//       });
//     }

//     if (data === "LAB" || data==='NDT') {
//       const latestLABOrder = await Orders.findOne({
//         where: {
//           division: { [Op.or]: ['NDT', "LAB"] },
//           order_number: { [Op.ne]: null },
//         },
//         order: [["order_number", "DESC"]],
//         attributes: ["order_number"],
//       });

//       const nextOrderNumber = (latestLABOrder?.order_number || 0) + 1;

//       return res.status(200).json({
//         division: "LAB",
//         nextOrderNumber,
//         nextPn,
//       });
//     }

//     return res.status(200).json({ nextPn });
//   } catch (error) {
//     console.error("Error fetching highest numbers:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

const getAllReqs = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const ordersDraftsList = await OrderDraft.findAll({});

    await t.commit();
    return res.status(200).json({ data: ordersDraftsList });
  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getIntegratedOrderData = async (req, res) => {
  try {
    const [orders] = await sequelize.query(`
  SELECT 
    o.order_id,
    o.division,
    o.order_number,
    o.dor,
    o.cancel, 
    COALESCE(o.reporting_address, c.reporting_address) AS reporting_address,

    sm.sample_id,
    sm.sample_code,
    sm.product_id,
    sm.test_req,
    sm.created_at,
    sm.registered,
    sm.club_id,
    sm.duedate,

    p.name AS product_name,

    sp.params_info,
    j.reportIssueDate,
    j.ulrData,
    j.end_date,
    j.discipline,

    e_phy.signature AS phy_signature,
    e_chem.signature AS chem_signature

  FROM orders o
  LEFT JOIN sample_materials sm ON o.order_id = sm.order_id
  LEFT JOIN products p ON sm.product_id = p.id
  LEFT JOIN (
      SELECT sample_id, JSON_ARRAYAGG(params_info) AS params_info
      FROM sample_params
      GROUP BY sample_id
  ) sp ON sm.sample_id = sp.sample_id
  LEFT JOIN jobs j ON TRIM(sm.sample_id) = TRIM(j.sample_id)

LEFT JOIN employee e_phy 
       ON j.discipline IN ('PHYSICAL', 'BOTH') 
      AND e_phy.emp_id = '1008'

LEFT JOIN employee e_chem 
       ON j.discipline IN ('CHEMICAL', 'BOTH')
      AND e_chem.emp_id = '1534'


  LEFT JOIN customers c ON o.customer_id = c.customer_id
  ORDER BY o.order_number ASC
`);

    const enhancedOrders = orders.map((order) => {
      let signature = null;

      switch (order.discipline) {
        case "PHYSICAL":
          signature = order.phy_signature || null;
          break;
        case "CHEMICAL":
          signature = order.chem_signature || null;
          break;
        case "BOTH":
          // Return both signatures as an array
          signature = [];
          if (order.phy_signature)
            signature.push({ type: "PHYSICAL", file: order.phy_signature });
          if (order.chem_signature)
            signature.push({ type: "CHEMICAL", file: order.chem_signature });
          break;
        default:
          signature = null;
      }

      return { ...order, signature };
    });

    return res.status(200).json({ data: enhancedOrders });
  } catch (error) {
    console.error("Error fetching integrated order data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  offlineOrderRegistration,
  getOrderUpdateFormData,
  getOrderDraftUpdateFormData,
  getCompleteOrderDetails,
  updateOfflineOrder,
  getAllOrders,
  getAllOrdersHighNums,
  getAllOrdersRevenue,
  saveDraftOrder,
  getAllReqs,
  getProformaInvoicesDaily,
  getOrdersRevenueDashboard,
  getTaxInvoicesDaily,
  offlineOrderRegistrationWithRor,
  updateOfflineOrderWithRor,
  getCustomersRevenueDashboard,
  getNewCustomers,
  getMonthlyMaterials,
  getMonthlyOutstanding,
  getMonthlyReceived,
  getMaterialQuotationsDashboard,
  getNdtQuotationsDashboard,
  getGtQuotationsDashboard,
  getIntegratedOrderData,
};

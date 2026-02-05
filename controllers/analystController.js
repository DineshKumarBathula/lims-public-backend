const { Jobs, SampleMaterials, Product } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const moment = require("moment");

// Helper: build date filter with employee ID
const buildDateFilter = (month, year, empId) => {
  let whereCondition = {};
  if (empId) whereCondition.emp_id = empId; // filter by logged-in user

  if (month !== "all" && year !== "all") {
    const startDate = moment(`${year}-${month}-01`).startOf("month").toDate();
    const endDate = moment(`${year}-${month}-01`).endOf("month").toDate();
    whereCondition.createdAt = { [Op.between]: [startDate, endDate] };
  } else if (month === "all" && year !== "all") {
    const startDate = moment(`${year}-01-01`).startOf("year").toDate();
    const endDate = moment(`${year}-12-31`).endOf("year").toDate();
    whereCondition.createdAt = { [Op.between]: [startDate, endDate] };
  } else if (month !== "all" && year === "all") {
    const startDate = moment(`2000-${month}-01`).startOf("month").toDate();
    const endDate = moment().endOf("month").toDate();
    whereCondition.createdAt = { [Op.between]: [startDate, endDate] };
  }

  return whereCondition;
};

// Material-wise tests (unique by product name)
const getTestsByMaterial = async (req, res) => {
  try {
    const { month = "all", year = "all" } = req.query;
    const empId = req.emp_id;
    const whereCondition = buildDateFilter(month, year, empId);

    const tests = await Jobs.findAll({
      attributes: [
        [col("sampleDetails->product.name"), "material"],
        [fn("COUNT", literal("DISTINCT Jobs.job_pk")), "test_count"],
      ],
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          attributes: [],
          include: [{ model: Product, as: "product", attributes: [] }],
        },
      ],
      where: whereCondition,
      group: [col("sampleDetails->product.name")],
      raw: true,
    });

    const formatted = tests.map((t) => ({
      material: t.material,
      test_count: Number(t.test_count),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getTestsByMaterial error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Daily trend of tests
const getTestsDailyTrend = async (req, res) => {
  try {
    const { month = "all", year = "all" } = req.query;
    const empId = req.emp_id;
    const whereCondition = buildDateFilter(month, year, empId);

    if (month === "all") return res.status(200).json([]);

    const counts = await Jobs.findAll({
      attributes: [
        [fn("DAY", col("Jobs.createdAt")), "day"],
        [fn("COUNT", "*"), "count"],
      ],
      where: whereCondition,
      group: [fn("DAY", col("Jobs.createdAt"))],
      order: [[fn("DAY", col("Jobs.createdAt")), "ASC"]],
      raw: true,
    });

    const formatted = counts.map((c) => ({
      day: Number(c.day),
      count: Number(c.count),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getTestsDailyTrend error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Total tests + material breakdown (unique by product name)
const getTotalTests = async (req, res) => {
  try {
    const { month = "all", year = "all" } = req.query;
    const empId = req.emp_id;
    const whereCondition = buildDateFilter(month, year, empId);

    const total = await Jobs.count({ where: whereCondition });

    const breakdown = await Jobs.findAll({
      attributes: [
        [col("sampleDetails->product.name"), "material"],
        [fn("COUNT", literal("DISTINCT Jobs.job_pk")), "count"],
      ],
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          attributes: [],
          include: [{ model: Product, as: "product", attributes: [] }],
        },
      ],
      where: whereCondition,
      group: [col("sampleDetails->product.name")],
      raw: true,
    });

    const formattedBreakdown = breakdown.map((b) => ({
      material: b.material,
      count: Number(b.count),
    }));

    res.status(200).json({
      total_tests: total,
      materials: formattedBreakdown,
    });
  } catch (error) {
    console.error("getTotalTests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getTestsByMaterial,
  getTestsDailyTrend,
  getTotalTests,
};

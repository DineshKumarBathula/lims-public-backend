// controllers/hodController.js
const { Jobs, Employee, SampleMaterials, Product } = require("../models");
const { Op } = require("sequelize");

// 🔄 Department → Discipline mapping
function mapDepartmentToDiscipline(department) {
  if (!department) return [];
  switch (department) {
    case "LABORATORY_CHEMICAL":
      return ["CHEMICAL"]; // Jobs table has CHEMICAL
    case "LABORATORY_MECHANICAL":
      return ["PHYSICAL"]; // Jobs table uses PHYSICAL
    case "LABORATORY_PHYSICAL":
      return ["PHYSICAL"];
    case "OPERATIONS":
      return ["CHEMICAL", "PHYSICAL"]; // ✅ Show both CHEM + PHYSICAL
    default:
      return [department]; // fallback
  }
}

// 📊 HOD Dashboard (Monthly Summary)
const getHodDashboard = async (req, res) => {
  try {
    const { department } = req; // ✅ from validateToken middleware

    if (!department) {
      return res
        .status(400)
        .json({ success: false, error: "Department not found in token" });
    }

    const disciplineList = mapDepartmentToDiscipline(department);

    // Fetch jobs only for mapped discipline(s)
    const jobs = await Jobs.findAll({
      where: { discipline: { [Op.in]: disciplineList } },
      include: [
        {
          model: Employee,
          as: "analyst",
          attributes: ["emp_id", "first_name", "last_name", "department"],
        },
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name"],
            },
          ],
        },
      ],
      attributes: ["job_pk", "emp_id", "status", "doa", "createdAt"],
    });

    // Grouping: Month-wise
    const jobsInMonth = {};
    const materialsInMonth = {};

    jobs.forEach((job) => {
      const jobDate = job.doa || job.createdAt;
      const month = new Date(jobDate).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      const material = job.sampleDetails?.product?.name || "Unknown";
      const emp = job.analyst?.first_name || job.emp_id || "Unknown";

      // (1) Material-wise jobs
      if (!materialsInMonth[month])
        materialsInMonth[month] = { materials: {}, totalJobs: 0 };
      if (!materialsInMonth[month].materials[material])
        materialsInMonth[month].materials[material] = 0;

      materialsInMonth[month].materials[material] += 1;
      materialsInMonth[month].totalJobs += 1;

      // (2) Employee-wise jobs
      if (!jobsInMonth[month])
        jobsInMonth[month] = { employees: {}, totalJobs: 0 };
      if (!jobsInMonth[month].employees[emp])
        jobsInMonth[month].employees[emp] = 0;

      jobsInMonth[month].employees[emp] += 1;
      jobsInMonth[month].totalJobs += 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        materialsInMonth,
        jobsInMonth,
      },
      discipline: department,
    });
  } catch (error) {
    console.error("Error in HOD dashboard:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 📋 HOD Jobs List (Flat Data - Only Jobs Count)
const getHodTests = async (req, res) => {
  try {
    const { department } = req;

    if (!department) {
      return res
        .status(400)
        .json({ success: false, error: "Department not found in token" });
    }

    const disciplineList = mapDepartmentToDiscipline(department);

    const jobs = await Jobs.findAll({
      where: { discipline: { [Op.in]: disciplineList } },
      include: [
        {
          model: Employee,
          as: "analyst",
          attributes: ["emp_id", "first_name", "last_name", "department"],
        },
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name"],
            },
          ],
        },
      ],
      attributes: ["job_pk", "emp_id", "status", "doa", "createdAt"],
    });

    const tests = jobs.map((job) => ({
      job_id: job.job_pk,
      material: job.sampleDetails?.product?.name || "Unknown",
      emp_id: job.emp_id,
      status: job.status,
      date: job.doa || job.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: tests,
      totalJobs: tests.length, // ✅ now counts jobs only
      discipline: department,
    });
  } catch (error) {
    console.error("Error fetching HOD jobs:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getHodDashboard,
  getHodTests,
};

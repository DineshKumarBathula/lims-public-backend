const { calculateDaysDiff } = require("../defs/customFunctions");
const {
  sequelize,
  Leaves,
  Jobs,
  SampleMaterials,
  Product,
  Params,
} = require("../models");
const { Employee } = require("../models");
const bcrypt = require("bcrypt");

const {
  findEmployeeById,
  findRoleByID,
  findDepartmentById,
  availableLeavesOfEmpByID,
  getAllLeaveRecordsByID,
} = require("./employeeControllers");
const { getAllTicketsOfEmpId } = require("./itControllers");

const getMyProfile = async (req, res) => {
  try {
    const requestedEmployee = await findEmployeeById(req.emp_id);
    const requestedRole = await findRoleByID(requestedEmployee.role);
    const requestedDepartment = await findDepartmentById(
      requestedEmployee.department
    );

    const requestedEmployeeRM = await findEmployeeById(
      requestedEmployee.reporting_manager
    );

    const { first_name, last_name, emp_id, profile_photo } =
      requestedEmployeeRM;

    requestedEmployee.rm = {
      name: first_name + " " + last_name,
      emp_id,
      profile_photo,
    };

    requestedEmployee.roleInfo = requestedRole;
    requestedEmployee.deptInfo = requestedDepartment;

    return res.status(200).json({ data: requestedEmployee });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const myTickets = await getAllTicketsOfEmpId(req.emp_id);
    return res.status(200).json({ data: myTickets });
  } catch (error) {
    console.log("Error fetching My Tickets", error);
    return res.status(500).json({ error: "Failed to fetch My tickets" });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const leaves = await getAllLeaveRecordsByID(req.emp_id);
    return res.status(200).json({ data: leaves });
  } catch (error) {
    console.log("Error fetching My leaves", error);
    return res.status(500).json({ error: "Failed to fetch My leaves" });
  }
};
const getMytests = async (req, res) => {
  try {
    const { emp_id } = req;

    const jobs = await Jobs.findAll({
      where: { emp_id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name", "image"],
            },
          ],
        },
      ],
    });

    // Aggregate total tests for the employee
    const totalTests = jobs.reduce((acc, job) => {
      const paramCount = JSON.parse(job.params_json || "[]").length || 1;
      return acc + paramCount;
    }, 0);

    // Format response
    const jobData = jobs.map((job) => ({
      id: job.job_pk,
      job_id: job.job_id,
      status: job.status,
      createdAt: job.createdAt,
      product: job.sampleDetails?.product?.name || null,
      productImage: job.sampleDetails?.product?.image || null,
      paramsCount: JSON.parse(job.params_json || "[]").length || 1,
    }));

    return res.status(200).json({
      success: true,
      totalTests,
      jobs: jobData,
    });
  } catch (error) {
    console.error("Error fetching employee tests:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch employee tests" });
  }
};

// Rename function
const getMyJobsStats = async (req, res) => {
  try {
    const { emp_id } = req;

    const jobs = await Jobs.findAll({
      where: { emp_id },
      order: [["job_pk", "DESC"]],
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name", "image", "id"],
            },
          ],
        },
      ],
    });

    // ---------- Stats ----------
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(
      (job) => job.status === "completed"
    ).length;
    const pendingJobs = jobs.filter((job) => job.status === "pending").length;
    const inProgressJobs = jobs.filter(
      (job) => job.status === "in_progress"
    ).length;

    let totalParams = 0;

    // ---------- Material Aggregation ----------

    // ---------- Material Aggregation ----------
    const materialMap = {}; // <-- declare this FIRST

    jobs.forEach((job) => {
      const productName = job.sampleDetails?.product?.name;
      if (!productName) return;

      const paramIds = JSON.parse(job.params_json || "[]");
      totalParams += paramIds.length;

      if (!materialMap[productName]) {
        materialMap[productName] = 0;
      }
      materialMap[productName] += paramIds.length || 1; // count tests
    });

    const materials = Object.entries(materialMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // sort descending by value

    // ---------- Daily Trend ----------
    const dailyTrendMap = {}; // ✅ plain JS object

    jobs.forEach((job) => {
      const day = new Date(job.createdAt).getDate();
      dailyTrendMap[day] = (dailyTrendMap[day] || 0) + 1;
    });

    const dailyTrend = Object.entries(dailyTrendMap)
      .map(([day, count]) => ({ day: Number(day), count }))
      .sort((a, b) => a.day - b.day);

    // ---------- Response ----------
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalJobs,
          completedJobs,
          pendingJobs,
          inProgressJobs,
          totalParams,
        },
        materials, // aggregated and unique
        dailyTrend, // daily count
        jobs: jobs.map((job) => ({
          id: job.job_pk,
          status: job.status,
          createdAt: job.createdAt,
          product: job.sampleDetails?.product?.name || null,
          productImage: job.sampleDetails?.product?.image || null,
          paramsCount: JSON.parse(job.params_json || "[]").length,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching job stats/details:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching jobs",
      error: error.message,
    });
  }
};

const getMyLeavesStatus = async (req, res) => {
  try {
    const availableLeaves = await availableLeavesOfEmpByID(req.emp_id);
    return res.status(200).json({ availableLeaves });
  } catch (error) {
    console.log("Error fetching My leaves status", error);
    return res.status(500).json({
      error:
        "Failed to fetch your available leaves, raise a ticket to report issue",
    });
  }
};

const applyLeave = async (req, res) => {
  const t = await sequelize.transaction();
  const { leave_type, start_date, end_date, reason } = req.body;
  const emp_id = req.emp_id;

  try {
    const daysDiff = calculateDaysDiff(start_date, end_date);

    if (daysDiff <= 0 || isNaN(daysDiff)) {
      throw new Error("Invalid date range.");
    }

    const employee = await Employee.findByPk(emp_id, { transaction: t });
    if (!employee) {
      throw new Error("Employee not found.");
    }

    await Employee.update(
      { available_leaves: sequelize.literal(`available_leaves-${daysDiff}`) },
      { where: { emp_id }, transaction: t, raw: true }
    );

    const newLeave = await Leaves.create(
      {
        emp_id,
        leave_type,
        start_date,
        end_date,
        days_count: daysDiff,
        reason,
        status: 0,
      },
      { transaction: t }
    );

    const availableLeaves = await availableLeavesOfEmpByID(req.emp_id, {
      transaction: t,
    });

    await t.commit();

    return res.status(200).json({
      message: `Your leave request of ${daysDiff} days is submitted and pending, please track your leave in your leaves page`,
      newLeave,
      availableLeaves,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error while applying leave:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to apply leave" });
  }
};

const updateMyPassword = async (req, res) => {
  const { currentPassword, password } = req.body;
  const emp_id = req.emp_id;

  try {
    const employee = await Employee.findOne({ where: { emp_id } });

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      employee.hashed_password
    );

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash the new password
    const newHashedPassword = await bcrypt.hash(password, 10);

    // Update the password in the database
    await Employee.update(
      { hashed_password: newHashedPassword },
      { where: { emp_id } }
    );

    return res.status(200).json({
      message: "Password successfully updated",
    });
  } catch (error) {
    console.error("Error while updating the password:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to update password" });
  }
};

module.exports = {
  getMyProfile,
  getMyTickets,
  getMyLeavesStatus,
  applyLeave,
  getMyLeaves,
  getMytests,
  getMyJobsStats,
  updateMyPassword,
};

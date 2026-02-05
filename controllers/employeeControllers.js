const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  Employee,
  Department,
  Role,
  Leaves,
  Notification,
} = require("../models/index");

const SECRET_KEY = process.env.JWT_SECRET_KEY || "tb-server-secret-key";

const getMyNotifications = async (req, res) => {
  const { emp_id } = req.query;
  console.log(emp_id, "datadata");

  try {
    const notifications = await Notification.findAll({
      where: { receiver_emp_id: emp_id },
      order: [["created_at", "DESC"]],
    });

    console.log(notifications, "NotificationsInfo");

    return res.status(200).json({ data: notifications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const loginEmployee = async (req, res) => {
  const { username, password } = req.body;
  console.log("aaa");
  try {
    const employee = await Employee.findOne({ where: { emp_id: username } });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      employee.hashed_password
    );

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password", employee });
    }
    const payload = {
      emp_id: employee.emp_id,
      access: employee.access_key,
      department: employee.department,
    };

    const token = jwt.sign(payload, SECRET_KEY);
    delete employee.dataValues.hashed_password;

    res.status(200).json({ jwt_token: token, employee });
    console.log("dsa");
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
  console.log("ddd");
};

const findEmployeeById = async (emp_id) => {
  try {
    const dbResponse = await Employee.findByPk(emp_id, { raw: true });
    if (!dbResponse) {
      throw new Error(`Employee with ID ${emp_id} not found.`);
    }
    return dbResponse;
  } catch (error) {
    console.error("Error finding employee:", error.message);
    throw new Error("An error occurred while fetching employee details.");
  }
};

const findDepartmentById = async (dept_id) => {
  try {
    const dbResponse = await Department.findByPk(dept_id, { raw: true });
    if (!dbResponse) {
      throw new Error(`Department with ID ${dept_id} not found.`);
    }
    return dbResponse;
  } catch (error) {
    console.error("Error finding Department:", error.message);
    throw new Error("An error occurred while fetching Department details.");
  }
};

const findRoleByID = async (role_id) => {
  try {
    const dbResponse = await Role.findByPk(role_id, { raw: true });
    if (!dbResponse) {
      throw new Error(`Role with ID ${role_id} not found.`);
    }
    return dbResponse;
  } catch (error) {
    console.error("Error finding Role:", error.message);
    throw new Error("An error occurred while fetching Role details.");
  }
};

const availableLeavesOfEmpByID = async (emp_id) => {
  try {
    const employee = await Employee.findByPk(emp_id, {
      attributes: ["available_leaves"],
      raw: true,
    });

    if (!employee) {
      throw new Error(`Employee with ID ${emp_id} not found.`);
    }

    return employee.available_leaves;
  } catch (error) {
    console.error(
      `Error fetching available leaves for employee ${emp_id}:`,
      error
    );
    throw error;
  }
};

const getAllLeaveRecordsByID = async (emp_id) => {
  try {
    const leaves = await Leaves.findAll({
      where: {
        emp_id: emp_id,
      },
      order: [["created_at", "DESC"]],
    });
    return leaves;
  } catch (error) {
    throw error;
  }
};

const checkEmpIDexist = async (emp_id) => {
  // console.log(emp_id,'emp_id9876')
  try {
    const dbResponse = await Employee.findAll();
    // console.log(dbResponse,'dbResponse')
    return dbResponse !== null;
    // console.log('ALL IS WELL')
  } catch (error) {
    throw new Error(`Employee ID ${emp_id} not found`);
  }
};

// Function to check if the password matches
const checkEmpPassword = async (emp_id, password) => {
  try {
    const employee = await Employee.findByPk(emp_id);
    if (!employee) throw new Error("Employee not found");

    const passwordMatched = await bcrypt.compare(
      password,
      employee.hashed_password
    );

    return passwordMatched;
  } catch (error) {
    console.log("Error in chech emp password");
    console.log(error);
    throw new Error("Error checking password");
  }
};

const loginLIMS = async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password, "dinesh");

  try {
    console.log("ddd");
    const empExists = await checkEmpIDexist(username);

    console.log(empExists, "empExistsempExists");
    console.log("kkk");
    if (empExists) {
      const passwordMatched = await checkEmpPassword(username, password);
      console.log(passwordMatched, "passwordMatched");
      console.log("lll");
      if (passwordMatched) {
        const requestedEmployee = await findEmployeeById(username);
        const requestedRole = await findRoleByID(requestedEmployee.role);
        const requestedDepartment = await findDepartmentById(
          requestedEmployee.department
        );
        console.log("ccc");
        const requestedEmployeeRM = await findEmployeeById(
          requestedEmployee.reporting_manager
        );
        console.log("ooo");
        const { first_name, last_name, emp_id, profile_photo } =
          requestedEmployeeRM;

        requestedEmployee.rm = {
          name: first_name + " " + last_name,
          emp_id,
          profile_photo,
        };
        console.log("ttt");

        requestedEmployee.roleInfo = requestedRole;
        requestedEmployee.deptInfo = requestedDepartment;
        const token = jwt.sign(
          {
            emp_id: username,
            access: requestedEmployee.access_key,
            department: requestedEmployee.department,
          },

          SECRET_KEY
        );
        console.log("ppppppp");

        return res.status(200).json({
          message: "Login successful",
          jwt_token: token,
          data: requestedEmployee,
        });
      }
      // Send password mismatch response
      return res.status(401).json({ message: "Incorrect password" });
    }
    return res.status(404).json({ message: "Employee not found" });
  } catch (error) {
    console.log(error, "errprrr");
    return res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  loginEmployee,
  findEmployeeById,
  findDepartmentById,
  findRoleByID,
  availableLeavesOfEmpByID,
  getAllLeaveRecordsByID,
  loginLIMS,
  getMyNotifications,
};

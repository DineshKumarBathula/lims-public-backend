const {
  Role,
  Department,
  Branch,
  AccessKey,
  Employee,
  Leaves,
} = require("../models/index");
const AWS = require("aws-sdk");

// const { KDM_EMPLOYEE_TOKEN } = require("../static/tokens");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const mime = require("mime-types");
const { getAllTicketsOfEmpId } = require("./itControllers");
const { getAllLeaveRecordsByID } = require("./employeeControllers");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

//roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    return res.status(200).json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addRole = async (req, res) => {
  const { role, responsibilities, min_salary, department } = req.body;

  try {
    const newRole = await Role.create({
      role,
      responsibilities,
      min_salary,
      department,
    });

    res.status(201).json({ message: "Role added successfully", role: newRole });
  } catch (error) {
    console.error("Error adding role:", error);
    res.status(500).json({ message: "Failed to add role" });
  }
};

const editRole = async (req, res) => {
  const roleId = req.params.id;
  const { role, responsibilities, min_salary, department } = req.body;

  try {
    const existingRole = await Role.findByPk(roleId);
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    await existingRole.update({
      role,
      responsibilities,
      min_salary,
      department,
    });

    res
      .status(200)
      .json({ message: "Role updated successfully", role: existingRole });
  } catch (error) {
    console.error("Error editing role:", error);
    res.status(500).json({ message: "Failed to edit role" });
  }
};

const deleteRole = async (req, res) => {
  const roleId = req.params.id;

  try {
    const existingRole = await Role.findByPk(roleId);
    if (!existingRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    await existingRole.destroy();

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Failed to delete role" });
  }
};

const getRoleById = async (req, res) => {
  const roleId = req.params.id;

  try {
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ message: "Failed to fetch role" });
  }
};

//branches
const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll();

    res.status(200).json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ message: "Failed to fetch branches" });
  }
};

const getBranchById = async (req, res) => {
  const branchId = req.params.id;

  try {
    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.status(200).json({ branch });
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ message: "Failed to fetch branch" });
  }
};

const addBranch = async (req, res) => {
  const { branch_id, branch, address } = req.body;

  try {
    const newBranch = await Branch.create({ branch_id, branch, address });
    res
      .status(201)
      .json({ message: "Branch added successfully", branch: newBranch });
  } catch (error) {
    console.error("Error adding branch:", error);
    res.status(500).json({ message: "Failed to add branch" });
  }
};

const editBranch = async (req, res) => {
  const branchId = req.params.id;
  const { branch, address } = req.body;

  try {
    const existingBranch = await Branch.findByPk(branchId);
    if (!existingBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await existingBranch.update({ branch, address });

    res
      .status(200)
      .json({ message: "Branch updated successfully", branch: existingBranch });
  } catch (error) {
    console.error("Error editing branch:", error);
    res.status(500).json({ message: "Failed to edit branch" });
  }
};

const deleteBranch = async (req, res) => {
  const branchId = req.params.id;

  try {
    const existingBranch = await Branch.findByPk(branchId);
    if (!existingBranch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    await existingBranch.destroy();

    res.status(200).json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ message: "Failed to delete branch" });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();

    res.status(200).json({ departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

const getDepartmentById = async (req, res) => {
  const deptId = req.params.id;

  try {
    const department = await Department.findByPk(deptId);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ department });
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({ message: "Failed to fetch department" });
  }
};

const addDepartment = async (req, res) => {
  const { dept_id, department, additional_info } = req.body;

  try {
    const newDepartment = await Department.create({
      dept_id,
      department,
      additional_info,
    });
    res.status(201).json({
      message: "Department added successfully",
      department: newDepartment,
    });
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json({ message: "Failed to add department" });
  }
};

const editDepartment = async (req, res) => {
  const deptId = req.params.id;
  const { department, additional_info } = req.body;

  try {
    const existingDepartment = await Department.findByPk(deptId);
    if (!existingDepartment) {
      return res.status(404).json({ message: "Department not found" });
    }

    await existingDepartment.update({ department, additional_info });

    res.status(200).json({
      message: "Department updated successfully",
      department: existingDepartment,
    });
  } catch (error) {
    console.error("Error editing department:", error);
    res.status(500).json({ message: "Failed to edit department" });
  }
};

const deleteDepartment = async (req, res) => {
  const deptId = req.params.id;

  try {
    const existingDepartment = await Department.findByPk(deptId);
    if (!existingDepartment) {
      return res.status(404).json({ message: "Department not found" });
    }

    await existingDepartment.destroy();

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({ message: "Failed to delete department" });
  }
};

//access keys
const getAllAccessKeys = async (req, res) => {
  try {
    const accessKeys = await AccessKey.findAll();
    res.status(200).json({ accessKeys });
  } catch (error) {
    console.error("Error fetching access keys:", error);
    res.status(500).json({ message: "Failed to fetch access keys" });
  }
};

const addAccessKey = async (req, res) => {
  const { access_id, label, description } = req.body;
  try {
    const newAccessKey = await AccessKey.create({
      access_id,
      label,
      description,
    });
    res.status(201).json({
      message: "Access key added successfully",
      accessKey: newAccessKey,
    });
  } catch (error) {
    console.error("Error adding access key:", error);
    res.status(500).json({ message: "Failed to add access key" });
  }
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.status(200).json({ employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
};

const uploadWorkOrderFileToS3 = (file, docName) => {
  return new Promise((resolve, reject) => {
    const contentType =
      mime.lookup(file.originalname) || "application/octet-stream";

    const uploadParams = {
      Bucket: process.env.STAFF_RECORDS || "tb-kdm-staff-files",
      Key: docName,
      Body: file.buffer,
      ContentType: contentType,
    };

    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.error("Error uploading file to S3:", err);
        reject(err);
      } else {
        console.log("File uploaded successfully:", data.Location);
        resolve(docName);
      }
    });
  });
};

const findEmpByID = async (emp_id) => {
  try {
    const emp = await Employee.findByPk(emp_id);
    return emp;
  } catch (err) {
    throw err;
  }
};

// const addEmployee = async (req, res) => {
//   const {
//     emp_id,
//     first_name,
//     last_name,
//     branch,
//     access_key,
//     reporting_manager,
//     phone_number,
//     department,
//     role,
//   } = req.body;
//   console.log(req.body);

//   try {
//     let dp = `${emp_id}-dp`;
//     const existingEmployee = await Employee.findOne({ where: { emp_id } });
//     if (existingEmployee) {
//       return res
//         .status(400)
//         .json({ error: "Employee with this ID already exists" });
//     }
//     if (!req.file) {
//       return res.status(400).json({ error: "Profile photo is mandatory" });
//     }

//     dp = await uploadWorkOrderFileToS3(req.file, dp);
//     const hashedPassword = await bcrypt.hash("KDM@123", 10);
//     const newEmployee = {
//       emp_id,
//       first_name,
//       last_name,
//       branch,
//       access_key,
//       reporting_manager,
//       phone_number,
//       department,
//       role,
//       profile_photo: dp,
//       hashed_password: hashedPassword,
//     };

//     await Employee.create(newEmployee);
//     res.status(200).json({
//       message: `${first_name} ${last_name} is successsfully registered with KDM and his/her password is KDM@123 `,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       error: `Failed to Register ${first_name} ${last_name}, please try again`,
//     });
//   }
// };

const addEmployee = async (req, res) => {
  const {
    emp_id,
    first_name,
    last_name,
    branch,
    access_key,
    reporting_manager,
    phone_number,
    department,
    role,
    empId,
  } = req.body;

  console.log("This is request.body : ");
  console.log(req.body);

  try {
    let profilePhotoKey = `${emp_id}-dp`;
    let signatureKey = `${emp_id}-sign`;

    // Files (if provided)
    const profilePhotoFile = req.files?.profile_photo?.[0];
    const signatureFile = req.files?.signature?.[0];

    if (empId) {
      const employee = await Employee.findOne({ where: { emp_id: empId } });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      let profilePhotoUrl = employee.profile_photo;
      let signatureUrl = employee.signature;

      if (profilePhotoFile) {
        profilePhotoUrl = await uploadWorkOrderFileToS3(
          profilePhotoFile,
          profilePhotoKey
        );
      }

      if (signatureFile) {
        signatureUrl = await uploadWorkOrderFileToS3(
          signatureFile,
          signatureKey
        );
      }

      await employee.update({
        first_name,
        last_name,
        branch,
        access_key,
        reporting_manager,
        phone_number,
        department,
        role,
        profile_photo: profilePhotoUrl,
        signature: signatureUrl,
      });

      return res.status(200).json({
        message: `Employee ${first_name} ${last_name} updated successfully`,
      });
    }

    const existingEmployee = await Employee.findOne({ where: { emp_id } });
    if (existingEmployee) {
      return res
        .status(400)
        .json({ error: "Employee with this ID already exists" });
    }

    if (!profilePhotoFile) {
      return res.status(400).json({ error: "Profile photo is mandatory" });
    }

    if (!signatureFile) {
      return res.status(400).json({ error: "Signature is mandatory" });
    }

    // Upload both files
    const profilePhotoUrl = await uploadWorkOrderFileToS3(
      profilePhotoFile,
      profilePhotoKey
    );
    const signatureUrl = await uploadWorkOrderFileToS3(
      signatureFile,
      signatureKey
    );

    const hashedPassword = await bcrypt.hash("KDM@123", 10);

    await Employee.create({
      emp_id,
      first_name,
      last_name,
      branch,
      access_key,
      reporting_manager,
      phone_number,
      department,
      role,
      profile_photo: profilePhotoUrl,
      signature: signatureUrl,
      hashed_password: hashedPassword,
    });

    return res.status(200).json({
      message: `${first_name} ${last_name} successfully registered with KDM. Default password is KDM@123`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: `Failed to register/update ${first_name} ${last_name}, please try again`,
    });
  }
};

const getEmployeeById = async (emp_id) => {
  try {
    const employeeInfo = await Employee.findByPk(emp_id, {
      include: [
        {
          model: Department,
          as: "departmentDetails",
        },
        {
          model: Role,
          as: "roleDetails",
        },

        {
          model: Employee,
          as: "reportingManager",
        },

        {
          model: Branch,
          as: "branchDetails",
        },
      ],
    });

    return employeeInfo;
  } catch (err) {
    throw err;
  }
};

const getAnalystProfile = async (req, res) => {
  const { empId } = req.params;

  try {
    const employeeInfo = await getEmployeeById(empId);
    console.log(employeeInfo);
    return res.status(200).json({ employeeInfo });
  } catch (err) {
    console.log("Failed to fetch Analyst details", err);
    return res.status(500).json({ error: "Failed to fetch Analyst details" });
  }
};

const fetchLeavesHistory = async (req, res) => {
  try {
    const dbResponse = await Leaves.findAll({
      include: [
        {
          model: Employee,
          as: "employee",
          attributes: ["emp_id", "first_name", "last_name", "profile_photo"],
          order: [
            ["created_at", "DESC"],
            ["status", "ASC"],
          ],
        },
      ],
    });

    return res.status(200).json({ data: dbResponse });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: `Failed to fetch leaves history`,
    });
  }
};

const fetchEmployeeDetailsById = async (req, res) => {
  const { emp_id } = req.query;
  console.log(req, "reqqq");
  try {
    const empDetails = await getEmployeeById(emp_id);
    const empTickets = await getAllTicketsOfEmpId(emp_id);
    const empLeaves = await getAllLeaveRecordsByID(emp_id);
    const team = await getReporteesByID(emp_id);
    return res.status(200).json({
      data: { empDetails, empTickets, empLeaves, team },
    });
  } catch (error) {
    console.log("Error while fetching employee by id", error);
    return res.status(500).json({
      error: `Failed to fetch Employee Profile`,
    });
  }
};

const getReporteesByID = async (emp_id) => {
  try {
    const res = await Employee.findAll({
      where: { reporting_manager: emp_id },
      include: [
        {
          as: "roleDetails",
          model: Role,
        },
        {
          as: "departmentDetails",
          model: Department,
        },
      ],
    });
    return res;
  } catch (error) {
    throw error; // Fixed the error variable here
  }
};

module.exports = {
  //roles
  getAllRoles,
  addRole,
  editRole,
  deleteRole,
  getRoleById,

  // Branches
  getAllBranches,
  getBranchById,
  addBranch,
  editBranch,
  deleteBranch,

  //departments
  getAllDepartments,
  getDepartmentById,
  addDepartment,
  editDepartment,
  deleteDepartment,

  //access keys
  getAllAccessKeys,
  addAccessKey,

  //employee
  addEmployee,
  getAllEmployees,
  getAnalystProfile,

  //leaves
  fetchLeavesHistory,
  fetchEmployeeDetailsById,

  getReporteesByID,
  findEmpByID,
};

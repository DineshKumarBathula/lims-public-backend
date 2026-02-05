const {
  sequelize,
  SampleMaterials,
  SampleParams,
  db,
  Employee,
  Product,
  Jobs,
  Params,
  Orders,
  Customers,
  Inventory,
  SampleMaterialFields,
  Client,
  OrderDraft,
} = require("../models/index");
const { Op, Sequelize } = require("sequelize");

const mime = require("mime-types");
const { v4: uuidv4 } = require("uuid");

const { ASSIGNED_TO_ANALYST } = require("../static/constants");
const { CHEMICAL, PHYSICAL, SRC_PATH } = require("../defs/CONST");
const { nablMechanical } = require("../reports/nablMechanical");
const {
  deleteS3Obj,
  getParamsDetails,
  getUltraFinalReport,
} = require("./bdControllers");
const AWS = require("aws-sdk");
const { getNonNablChemicalReport } = require("../reports/nonNablChemical");
const { getIp, createAlog } = require("./LogsController");
// const Client = require("../models/Client");
// const genralChemicalTestReport = require("../reports/genralChemicalTestReport")
const { getMyProfile } = require("./currentUserControllers");
const { convertToDDMMYYYY, getsignFile } = require("../defs/customFunctions");
const { nonNablMechanical } = require("../reports/nonNablPhysical");
const { sendWhatsAppMessage } = require("./whatsappController");
const generateReviewRequestPDF = require("../reports/ror");
const { dataValues } = require("../models/Logs");
const { PDFDocument } = require("pdf-lib");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
console.log("🔥🔥🔥 LAB CONTROLLERS LOADED 🔥🔥🔥");

const uploadFileToS3 = (file) => {
  return new Promise((resolve, reject) => {
    const uniqid = uuidv4();
    const uniqueName = `${Date.now()}-${uniqid}-${file.originalname}`;
    const contentType = mime.lookup(uniqueName) || "application/octet-stream";
    const params = {
      Bucket: process.env.AWS_INVENTORY_BUCKET,
      Key: uniqueName,
      Body: file.buffer,
      // ACL: "public-read",
      ContentType: contentType,
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error uploading file to S3:", err);
        reject(err);
      } else {
        console.log("success78", data.Location);
        resolve(uniqueName);
      }
    });
  });
};

const deleteFileFromS3 = async (fileName) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_INVENTORY_BUCKET,
      Key: fileName,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error("Error deleting old file from S3:", err);
        reject(err);
      } else {
        console.log("deleted432", fileName);
        resolve(data);
      }
    });
  });
};

const submitEquip = async (req, res) => {
  try {
    const division = req.body.division;
    const equipmentName = req.body.equipment_name;
    const reviewedEmp = req.body.reviewed_by;
    let iData = {};
    iData = req.body.i_data;
    // console.log(req.body,'body876')
    // ------------------------
    // MAIN EQUIPMENT IMAGE UPLOAD
    // ------------------------
    let equip_img = null;

    if (req.files?.equip_img) {
      equip_img = await uploadFileToS3(req.files.equip_img[0]);
    } else if (req.files?.consumable_img) {
      equip_img = await uploadFileToS3(req.files.consumable_img[0]);
    } else if (req.files?.furniture_img) {
      equip_img = await uploadFileToS3(req.files.furniture_img[0]);
    } else if (req.files?.hardware_img) {
      equip_img = await uploadFileToS3(req.files.hardware_img[0]);
    }

    let newEquip;

    // =================================================================
    //  CASE 1: FIXED ASSETS - ALSO HANDLE 3 CERTIFICATE FILES
    // =================================================================
    if (division === "Fixed Assets") {
      const {
        equipment_name,
        calibrated_by,
        make,
        serial_number,
        lab_id,
        equipment_range,
        least_count,
        calibration_date,
        due_calibration_date,
        measurement_uncertainty,
        reviewed_by,
        group,
        discipline,
        add_info,
      } = req.body;

      // -----------------------------
      // Upload 3 optional certificate files
      // -----------------------------
      let calib_c1 = null;
      let calib_c2 = null;
      let calib_c3 = null;

      if (req.files?.calib_c1) {
        calib_c1 = await uploadFileToS3(req.files.calib_c1[0]);
      }
      if (req.files?.calib_c2) {
        calib_c2 = await uploadFileToS3(req.files.calib_c2[0]);
      }
      if (req.files?.calib_c3) {
        calib_c3 = await uploadFileToS3(req.files.calib_c3[0]);
      }

      // -----------------------------
      // CREATE RECORD
      // -----------------------------
      newEquip = await Inventory.create({
        division,
        equipment_name,
        calibrated_by,
        equip_img,
        make,
        serial_number,
        lab_id,
        equipment_range,
        least_count,
        calibration_date,
        due_calibration_date,
        measurement_uncertainty,
        reviewed_by,
        group,
        discipline,
        add_info,

        // Set certificate file URLs
        calib_c1,
        calib_c2,
        calib_c3,

        i_data: null,
      });
    }

    // =================================================================
    //  CASE 2: CONSUMABLES / FURNITURE / IT HARDWARE
    // =================================================================
    else {
      const allowedImgField =
        req.body.consumable_img ||
        req.body.furniture_img ||
        req.body.hardware_img;

      const finalImage = equip_img || allowedImgField || null;

      let filteredData = { ...req.body, ...iData };
      delete filteredData.division;
      delete filteredData.consumable_img;
      delete filteredData.furniture_img;
      delete filteredData.hardware_img;
      delete filteredData.equipment_name;
      delete filteredData.reviewed_by;

      newEquip = await Inventory.create({
        division,
        equip_img: finalImage,
        i_data: filteredData,
        equipment_name: equipmentName,
        reviewed_by: reviewedEmp,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Equipment added successfully!",
      data: newEquip,
    });
  } catch (error) {
    console.error("Error uploading Equipment:", error);
    res.status(500).send("Failed to upload Equipment");
  }
};

const updateEquip = async (req, res) => {
  try {
    const { equip_id } = req.params;
    const {
      division,
      equipment_name,
      calibrated_by,
      make,
      serial_number,
      lab_id,
      equipment_range,
      least_count,
      calibration_date,
      due_calibration_date,
      measurement_uncertainty,
      reviewed_by,
      group,
      discipline,
      add_info,
      isNewImage,
      isNewCalib1,
      isNewCalib2,
      isNewCalib3,
      i_data,
    } = req.body;

    // Fetch existing record
    const existingEquip = await Inventory.findByPk(equip_id);
    if (!existingEquip) {
      return res.status(404).json({ message: "Equipment not found" });
    }

    // --------------------------------------------------------------------
    // COMMON UPDATE FIELDS
    // --------------------------------------------------------------------
    let updatedData = {
      division,
      equipment_name,
      reviewed_by,
    };

    // --------------------------------------------------------------------
    // FIXED ASSETS UPDATE
    // --------------------------------------------------------------------
    if (division === "Fixed Assets") {
      updatedData = {
        ...updatedData,
        calibrated_by,
        make,
        serial_number,
        lab_id,
        equipment_range,
        least_count,
        calibration_date,
        due_calibration_date,
        measurement_uncertainty,
        group,
        discipline,
        add_info,
      };

      // -------- EQUIPMENT IMAGE --------
      if (req.files?.equip_img && isNewImage === "true") {
        if (existingEquip.equip_img) {
          await deleteFileFromS3(existingEquip.equip_img);
        }
        updatedData.equip_img = await uploadFileToS3(req.files.equip_img[0]);
      }

      // -------- CERTIFICATES (C1,C2,C3) --------
      if (req.files?.calib_c1 && isNewCalib1 === "true") {
        if (existingEquip.calib_c1)
          await deleteFileFromS3(existingEquip.calib_c1);
        updatedData.calib_c1 = await uploadFileToS3(req.files.calib_c1[0]);
      }

      if (req.files?.calib_c2 && isNewCalib2 === "true") {
        if (existingEquip.calib_c2)
          await deleteFileFromS3(existingEquip.calib_c2);
        updatedData.calib_c2 = await uploadFileToS3(req.files.calib_c2[0]);
      }

      if (req.files?.calib_c3 && isNewCalib3 === "true") {
        if (existingEquip.calib_c3)
          await deleteFileFromS3(existingEquip.calib_c3);
        updatedData.calib_c3 = await uploadFileToS3(req.files.calib_c3[0]);
      }

      // update DB
      await Inventory.update(updatedData, { where: { equip_id } });
    }

    // --------------------------------------------------------------------
    // NON-FIXED DIVISIONS
    // CONSUMABLES / FURNITURE / IT HARDWARE
    // --------------------------------------------------------------------
    else {
      // Determine correct image field like in create()
      const imgFieldMap = {
        Consumables: "consumable_img",
        Furniture: "furniture_img",
        "IT Hardware": "hardware_img",
      };

      const imgField = imgFieldMap[division];

      // ----------------- IMAGE UPDATE -----------------
      if (req.files?.[imgField] && isNewImage === "true") {
        if (existingEquip.equip_img) {
          await deleteFileFromS3(existingEquip.equip_img);
        }
        updatedData.equip_img = await uploadFileToS3(req.files[imgField][0]);
      }

      // ----------------- i_data UPDATE -----------------
      let parsedIData = i_data;
      if (typeof parsedIData === "string") {
        parsedIData = JSON.parse(parsedIData);
      }

      updatedData.i_data = {
        ...existingEquip.i_data,
        ...parsedIData,
      };
    }

    // --------------------------------------------------------------------
    // FINAL UPDATE + RESPONSE
    // --------------------------------------------------------------------
    await Inventory.update(updatedData, { where: { equip_id } });

    const freshRecord = await Inventory.findByPk(equip_id);

    return res.status(200).json({
      success: true,
      message: "Equipment updated successfully",
      data: freshRecord,
    });
  } catch (error) {
    console.error("Error updating equipment:", error);
    res.status(500).json({ message: "Failed to update equipment" });
  }
};

const getAllEquip = async (req, res) => {
  try {
    const equipment = await Inventory.findAll(); // Fetch all rows with all columns

    res.status(200).json({ data: equipment });
  } catch (err) {
    console.error("Error fetching equipment:", err);
    res.status(500).json({ error: "Failed to fetch equipment details" });
  }
};

const getEquipById = async (identity) => {
  try {
    const equipInfo = await Inventory.findByPk(identity);

    return equipInfo;
  } catch (err) {
    throw err;
  }
};

const getEquipProfile = async (req, res) => {
  const { identity } = req.query;

  try {
    // 1️⃣ Fetch equipment info by primary key
    const equipInfo = await Inventory.findByPk(identity);

    if (!equipInfo) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    // 2️⃣ Extract reviewer id from equipment record
    const reviewerId = equipInfo.reviewed_by;

    // 3️⃣ Fetch employee details based on emp_id
    let reviewerInfo = null;
    if (reviewerId) {
      reviewerInfo = await Employee.findOne({
        where: { emp_id: reviewerId },
        attributes: [
          // "emp_id",
          "first_name",
          "last_name",
          // "phone_number",
          // "department",
          // "role",
          // "branch",
          // "signature",
        ],
      });
    }

    // 4️⃣ Respond with both equipment + reviewer data
    return res.status(200).json({
      equipInfo,
      reviewerInfo,
    });
  } catch (err) {
    console.error("Failed to fetch Equipment details:", err);
    return res.status(500).json({ error: "Failed to fetch Equipment details" });
  }
};

// const getEquipProfile = async (req, res) => {
//   const { identity } = req.query;

//   try {
//     const equipInfo = await Inventory.findByPk(identity);
//     console.log(equipInfo,'equipInfo87')

//     if (!equipInfo) {
//       throw new Error("Equipment not found");
//     }

//     return res.status(200).json({ equipInfo });
//   } catch (err) {
//     console.error("Failed to fetch Analyst details", err);
//     return res.status(500).json({ error: "Failed to fetch Analyst details" });
//   }
// };

const getPendingAssigningOrders = async (req, res) => {
  try {
    const orders = await db.Orders.findAll({
      order: [["created_at", "DESC"]],
      include: [
        {
          model: db.SampleMaterials,
          as: "samples",
          attributes: [
            "sample_id",
            "product_id",
            "source",
            "quantity",
            "grade",
            "brandName",
            "week_no",
            "ref_code",
            "sample_id_optional_field",
            "sample_code",
            "site_name",
            "doa",
            "job_assigned",
          ],
          include: [
            {
              model: SampleParams,
              as: "params",
              attributes: ["param_id", "params_info", "status", "analyst"],
              include: [
                {
                  model: db.Params,
                  as: "param",
                  attributes: ["discipline"],
                },
                {
                  model: db.Employee,
                  as: "employee",
                  attributes: ["emp_id", "username", "profile_photo"],
                },
              ],
            },
            {
              model: db.Product,
              as: "product",
              attributes: ["id", "name", "base_price"],
            },
          ],
        },
      ],
      attributes: [
        "order_id",
        "created_at",
        "registration_done",
        "project_name",
        "subject",
        "letter",
        "duedate",
        "order_number",
        "lab",
        "converted_to_tax",
      ],
      where: {
        order_closed: false,
        registration_done: true,
      },
    });

    const formattedOrders = orders.map((order) => {
      const formattedOrder = order.toJSON();

      if (formattedOrder.samples) {
        formattedOrder.samples = formattedOrder.samples.map((sample) => {
          if (sample.params) {
            sample.params = sample.params.map((param) => {
              if (param.params_info) {
                try {
                  param.params_info = JSON.parse(param.params_info);
                } catch (error) {
                  console.error("Failed to parse params_info:", error);
                  param.params_info = null;
                }
              }
              return param;
            });
          }
          return sample;
        });
      }

      return formattedOrder;
    });

    // Return the filtered and formatted orders as JSON response
    res.status(200).json({ data: formattedOrders });
  } catch (error) {
    console.error("Error fetching order details : ", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

const getRegisterdButPendingAssignedSamples = async (req, res) => {
  try {
    const { dept } = req.query;
    const pendingAssignedSamples =
      await getPendingAssignedSamplesController(dept);
    res.status(200).json({ data: pendingAssignedSamples });
  } catch (error) {
    console.error("Error fetching pending assigned samples: ", error);
    res
      .status(500)
      .json({ error: "Failed to fetch pending assigned samples." });
  }
};

const getPendingAssignedSamplesController = async (dept) => {
  try {
    const jobs = await Jobs.findAll({
      where: {
        status: 0,
        discipline: {
          [Op.like]: `%${dept}%`,
        },
      },
      order: [["job_pk", "DESC"]],
    });

    // Process each job to fetch corresponding Params, SampleMaterial, and Product details
    const jobsWithDetails = await Promise.all(
      jobs.map(async (job) => {
        const paramIds = job.params_json ? JSON.parse(job.params_json) : [];

        // Fetch details of each param ID from Params table
        const paramsDetails = await Params.findAll({
          attributes: ["params", "param_id"],
          where: {
            param_id: {
              [Op.in]: paramIds,
            },
          },
        });

        // Fetch SampleMaterial details for the job's sample_id
        const sampleMaterial = await SampleMaterials.findOne({
          where: { sample_id: job.sample_id },
          attributes: ["sample_id", "product_id", "sample_code"],
        });

        // Fetch Product details associated with SampleMaterial
        const product = sampleMaterial
          ? await Product.findOne({
              where: { id: sampleMaterial.product_id },
              attributes: ["id", "name", "image"],
            })
          : null;

        return {
          ...job.toJSON(), // Convert job instance to plain object
          params_details: paramsDetails,
          sample_material: sampleMaterial,
          product_details: product,
        };
      }),
    );

    return jobsWithDetails;
  } catch (error) {
    console.error("Error in getPendingAssignedSamplesController: ", error);
    throw new Error("Unable to retrieve pending assigned samples.");
  }
};

const getAllAnalyst = async (req, res) => {
  try {
    const labstaff = await Employee.findAll({
      attributes: [
        "first_name",
        "last_name",
        "profile_photo",
        "emp_id",
        "department",
      ],
      where: {
        department: {
          [Op.or]: ["LABORATORY_CHEMICAL", "LABORATORY_MECHANICAL"],
        },
      },
    });

    res.status(200).json({ data: labstaff });
  } catch (err) {
    console.error("Error fetching lab staff:", err);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

const assignSamplesToAnalyst = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { chemist, physicist, sampleId } = req.body;

    if (!sampleId) {
      return res
        .status(400)
        .json({ error: "Missing required field: sampleId" });
    }

    const sampleParams = await SampleParams.findAll({
      where: { sample_id: sampleId },
      include: [
        {
          model: db.Params,
          as: "param",
          attributes: ["discipline"],
        },
      ],
    });

    if (!sampleParams.length) {
      return res
        .status(404)
        .json({ error: "No sample parameters found for the given sampleId" });
    }

    const chemicalParams = sampleParams.filter(
      (param) => param.param.discipline === "CHEMICAL",
    );
    const physicalParams = sampleParams.filter(
      (param) => param.param.discipline === "PHYSICAL",
    );

    // Only update if chemist or physicist are defined
    const updatePromises = [];

    updatePromises.push(
      ...chemicalParams.map((param) =>
        param.update(
          { analyst: chemist, status: ASSIGNED_TO_ANALYST },
          { transaction: t },
        ),
      ),
    );

    updatePromises.push(
      ...physicalParams.map((param) =>
        param.update(
          { analyst: physicist, status: ASSIGNED_TO_ANALYST },
          { transaction: t },
        ),
      ),
    );

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      ``;
    }

    await SampleMaterials.update(sampleDetails, {
      where: { sample_id },
      transaction: t,
    });

    await t.commit();
    res.status(200).json({ message: "Sample parameters updated successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Error Assigning Jobs:", error);
    res.status(500).json({ error: "Failed to Assign Jobs" });
  }
};

const getJobParamsDetails = async (req, res) => {
  const { jId, review } = req.query;
  const { emp_id } = req;
  try {
    const job = await Jobs.findByPk(jId, {
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
        },
      ],
    });

    // Check if the job exists
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found.",
      });
    }

    // Check if the emp_id matches
    if (job.emp_id != emp_id && !review) {
      return res.status(403).json({
        success: false,
        message: "This is not your job.",
      });
    }

    const sampleParamDetails = await SampleMaterials.findAll({
      where: { sample_id: job.sampleDetails.sample_id },
    });
    console.log(job, "jober765");
    // Parse the params_json column
    const paramsJson = JSON.parse(job.params_json || "[]");
    const jData = job.jdata;
    console.log(paramsJson, "paramsJson72");

    return res.status(200).json({
      success: true,
      message: "Job parameters fetched successfully.",
      data: paramsJson,
      sampleDetails: job.sampleDetails,
      jdata: jData,
      jobDetails: job,
      sampleParamDetails: sampleParamDetails,
    });
  } catch (error) {
    console.error("Error fetching job parameters:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
const repeatJob = async (req, res) => {
  try {
    const { job_pk } = req.body;

    // 1️⃣ Get old job
    const oldJob = await Jobs.findByPk(job_pk);

    if (!oldJob) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Create new job with parent link
    const newJob = await Jobs.create({
      sample_id: oldJob.sample_id,
      discipline: oldJob.discipline,
      nabl: oldJob.nabl,
      params_json: oldJob.params_json,
      parent_job_pk: oldJob.job_pk, // ⭐ link
      status: 0,
    });

    return res.status(200).json({
      message: "Repeat job created",
      data: newJob,
    });
  } catch (err) {
    console.error("repeat job error:", err);
    return res.status(500).json({ error: "Failed to repeat job" });
  }
};
const repeatFullOrder = async (req, res) => {
  try {
    const { order_id } = req.body;

    // 1️⃣ Get old order
    const oldOrder = await Orders.findByPk(order_id);
    if (!oldOrder) return res.status(404).json({ error: "Order not found" });

    // 2️⃣ Get last order number
    const lastOrder = await Orders.findOne({
      attributes: ["order_number"],
      order: [[sequelize.literal("CAST(order_number AS UNSIGNED)"), "DESC"]],
    });

    const nextOrderNumber =
      lastOrder && lastOrder.order_number
        ? Number(lastOrder.order_number) + 1
        : 1;

    // 3️⃣ Create new order
    const newOrder = await Orders.create({
      customer_id: oldOrder.customer_id,
      order_number: nextOrderNumber,
      amount: 0,
      discount: 100,
      parent_order_id: oldOrder.order_id,
      mode: oldOrder.mode,
    });

    // 4️⃣ Get samples
    const samples = await Samples.findAll({
      where: { order_id },
    });

    for (const s of samples) {
      // 5️⃣ Create sample
      const newSample = await Samples.create({
        order_id: newOrder.order_id,
        product_id: s.product_id,
        test_req: s.test_req,
        duedate: s.duedate,
      });

      // 6️⃣ Copy jobs
      const jobs = await Jobs.findAll({
        where: { sample_id: s.sample_id },
      });

      for (const j of jobs) {
        await Jobs.create({
          sample_id: newSample.sample_id,
          discipline: j.discipline,
          nabl: j.nabl,
          params_json: j.params_json,
          parent_job_pk: j.job_pk,
          status: 0,
        });
      }
    }

    return res.json({
      message: "Order repeated successfully",
      new_order_id: newOrder.order_id,
      order_number: nextOrderNumber,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Repeat order failed" });
  }
};

const assignJobToAnalyst = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { analyst, jobId } = req.body;
    const updatedfields = {
      emp_id: analyst,
      status: 1,
      doa: new Date(),
    };

    const updateCheck = await Jobs.update(updatedfields, {
      where: { job_pk: jobId },
      transaction: t,
    });

    const log = {
      lc_id: 5,
      description: `Form Number ${jobId} is assigned to analyst ${analyst}`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };

    await createAlog(log, t);
    await t.commit();
    res.status(200).json({ message: "Job Assigned successfully", jobId });
  } catch (error) {
    await t.rollback();
    console.error("Error assigning job to analyst:", error);
    res.status(500).json({ error: "Error assigning job to analyst" });
  }
};

const getSamplesInProgress = async (req, res) => {
  try {
    const jobs = await Jobs.findAll({
      where: {
        status: {
          [Op.or]: [1, 2, 3],
        },
      },
      order: [["job_pk", "DESC"]],

      include: [
        {
          model: Employee,
          as: "analyst", // Use the alias defined in the Jobs model association
          attributes: ["emp_id", "first_name", "last_name", "profile_photo"], // Only fetch these fields
        },
      ],
    });

    const jobsWithDetails = await Promise.all(
      jobs.map(async (job) => {
        const paramIds = job.params_json ? JSON.parse(job.params_json) : [];

        // Fetching parameter details
        const paramsDetails = await Params.findAll({
          attributes: ["params", "param_id"],
          where: {
            param_id: {
              [Op.in]: paramIds,
            },
          },
        });

        // Fetching sample material details along with associated order (to get due_date)
        const sampleMaterial = await SampleMaterials.findOne({
          where: { sample_id: job.sample_id },
          attributes: [
            "sample_id",
            // "source",
            // "quantity",
            // "grade",
            // "brandName",
            // "site_name",
            "product_id",
            "order_id",
            "sample_code",
            "test_req",
            "duedate",
          ],
          include: [
            {
              model: Orders,
              as: "order", // Use alias if defined in the association
              attributes: ["created_at"], // Only fetching due_date from Orders
            },
          ],
        });

        // Fetching product details if sample material exists
        const product = sampleMaterial
          ? await Product.findOne({
              where: { id: sampleMaterial.product_id },
              attributes: ["id", "name", "image"],
            })
          : null;

        return {
          ...job.toJSON(),
          params_details: paramsDetails,
          sample_material: sampleMaterial,
          product_details: product,
          duedate: sampleMaterial?.order?.duedate || null, // Extract due_date from the joined Orders data
        };
      }),
    );

    res.status(200).json({ data: jobsWithDetails });
  } catch (error) {
    console.error("Error fetching samples in progress", error);
    res.status(500).json({ error: "Error while fetching samples in progress" });
  }
};

const getAllMyJobs = async (req, res) => {
  try {
    const { emp_id } = req;
    // Fetch all jobs for the given employee, including sample details.
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
            {
              model: Orders,
              as: "order",
              attributes: ["order_number"], // ✅ pull only order_number (or add more fields)
            },
          ],
        },
      ],
    });

    // Process each job to parse params_json and fetch related parameter details
    const processedJobs = await Promise.all(
      jobs.map(async (job) => {
        // Parse the params_json field to get parameter IDs
        const paramIds = JSON.parse(job.params_json || "[]");

        // Fetch parameter details based on parsed IDs
        const paramDetails = await Params.findAll({
          where: {
            param_id: paramIds,
          },
        });

        // Parse the `params` attribute within each parameter detail
        const parsedParamDetails = paramDetails.map((param) => ({
          ...param.toJSON(),
          params: param.params ? JSON.parse(param.params) : null, // Parse params if it exists
        }));

        return {
          ...job.toJSON(),
          params: parsedParamDetails, // Include parsed parameter details
          keka_id: parsedParamDetails[0]?.subgroup,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      data: processedJobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching jobs",
      error: error.message,
    });
  }
};

const getMyRORReport = async (req, res) => {
  const { orderNumber } = req.body;

  try {
    const review = await Orders.findOne({
      where: { order_id: orderNumber },
    });

    if (!review) {
      return res.status(404).json({ error: "Job not found" });
    }

    generateReviewRequestPDF(review.dataValues, res);
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const FIELD_LABEL_MAP = {
  source: "Source",
  sample_location: "Sample Location",
  no_of_samples: "No of samples",
  quantity: "Quantity",
  batch_number: "Batch Number",
  lot_number: "Lot Number",
  grade: "Grade",
  type: "Type",
  brandName: "Brand",
  week_no: "Week Number",
  ref_code: "Ref Code",
  site_name: "Site Name",
  sample_id_optional_field: "Sample ID",
  due_date: "Due Date",
  work_name: "Name of the work",
  loa_no: "LOA No",
  specimen_dimensions: "Dimensions of specimen (mm)",
  ca_no: "CA No",
  section: "Section",
  contractor_name: "Name of the Contractor",
};

const getMyReport = async (req, res) => {
  const { jId, jdata, accessKey, bulk = false } = req.body;

  try {
    const job = await Jobs.findOne({
      where: { job_pk: jId },
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
            },
            {
              model: Orders,
              as: "order",
              include: [
                {
                  model: Customers,
                  as: "customer",
                },
              ],
            },
          ],
        },
      ],
    });

    // console.log(job, "n87");

    if (!job) return res.status(404).json({ error: "Job not found" });

    const sampleId = job.sampleDetails?.id || job.sample_id;

    const club_id = job?.sampleDetails?.dataValues?.club_id;
    // console.log(club_id, "club_id");
    let formattedRelayData = [];
    if (sampleId) {
      // const sampleRelayData = await SampleMaterialFields.findAll({
      //   where: { club_id: club_id },
      // });

      const sampleRelayData = await SampleMaterialFields.findAll({
        where: { sample_id: sampleId },
      });

      formattedRelayData = Array.isArray(sampleRelayData)
        ? sampleRelayData.map((item) => ({
            label: FIELD_LABEL_MAP[item.field_name] || item.field_name,
            answer: item.field_value,
          }))
        : [];
    }
    console.log(formattedRelayData, "formattedRelayData87");
    const startD = job.start_date;
    const endD = job.end_date;

    const sampleInfo = job.sampleDetails;
    const productInfo = await Product.findByPk(sampleInfo.product_id, {
      attributes: ["name", "id"],
    });

    let custDetails = sampleInfo.order.customer.dataValues;

    const {
      sampleDetails: { order: orderDetails },
    } = job.dataValues;
    const clientFilter = orderDetails.client_id;

    if (clientFilter) {
      const clientDetails = await Client.findOne({
        where: { client_id: clientFilter },
      });

      const { reporting_name, reporting_address } = clientDetails.dataValues;

      custDetails.reporting_name = reporting_name;
      custDetails.reporting_address = reporting_address;
    }
    console.log(job.jdata, "jd87");
    const reportFunParams = {
      urlNumber: job.ulrData,
      reportIssueDate: job.reportIssueDate,
      jobInfo: job,
      orderInfo: sampleInfo.order,
      customerInfo: custDetails,
      sampleInfo,
      productInfo,
      jdata: job.jdata,
      reportPlace: job.reportLocation,
    };
    const {
      dataValues: {
        sampleDetails: {
          dataValues: { test_req, product_id },
        },
      },
    } = job;
    console.log(test_req, product_id, "product_id879");
    let delteriousCondition = "";
    if (product_id === 43) {
      delteriousCondition = test_req;
      productInfo.name = `${productInfo.name} (${test_req})`;
    } else if (product_id === 42) {
      // formattedRelayData.push({
      //   label: "Aggregate Size",
      //   answer: `${test_req} mm`,
      // });
      productInfo.name = `${productInfo.name} (${test_req} mm)`;
    } else if (product_id === 48) {
      if (test_req && String(test_req).trim() !== "") {
        formattedRelayData.push({
          label: "Source ",
          answer: test_req,
        });
      }
    } else if (product_id === 26) {
      if (test_req && String(test_req).trim() !== "") {
        formattedRelayData.push({
          label: "Sample Location ",
          answer: test_req,
        });
      }
    } else if (product_id === 57) {
      let parsedSource = { source: "" };
      parsedSource = JSON.parse(test_req);
      formattedRelayData.push({
        label: "Source",
        answer: `${parsedSource?.source}`,
      });
    } else if (product_id === 139 || product_id === 52) {
      formattedRelayData.push({
        label: "Grade",
        answer: test_req ? test_req : "",
      });
    }

    const signs = {
      chemical: false,
      showHodSigns: false,
      mechanical: accessKey,
    };

    if (job.discipline === CHEMICAL && job.nabl) {
      signs.chemical = true;
      signs.mechanical = false;
      return getNonNablChemicalReport(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        job,
        signs,
        bulk,
      );
    } else if (job.discipline === CHEMICAL && !job.nabl) {
      signs.chemical = true;
      signs.mechanical = false;
      return getNonNablChemicalReport(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        job,
        signs,
        bulk,
      );
    } else if (job.discipline === PHYSICAL && job.nabl) {
      signs.mechanical = true;
      signs.chemical = false;
      return nablMechanical(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        job,
        signs,
        bulk,
      );
    } else if (job.discipline === PHYSICAL && !job.nabl) {
      signs.mechanical = true;
      signs.chemical = false;
      return nonNablMechanical(
        reportFunParams,
        jId,
        startD,
        endD,
        res,
        formattedRelayData,
        accessKey,
        delteriousCondition,
        job,
        signs,
        bulk,
      );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const mergeReports = async (req, res) => {
  try {
    const { jobIds, accessKey } = req.body;

    if (!jobIds || jobIds.length === 0) {
      return res.status(400).json({ error: "No job IDs provided" });
    }

    const mergedPdf = await PDFDocument.create();

    for (const jobId of jobIds) {
      // ✅ call existing report function
      const pdfBuffer = await getMyReport(
        {
          body: { jId: jobId, accessKey, bulk: true }, // mimic req.body of getMyReport
        },
        {
          status: () => ({ json: () => {} }), // dummy res since getMyReport expects it
        },
      );

      if (!pdfBuffer) continue; // skip if no report generated

      const pdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=merged.pdf");
    return res.send(Buffer.from(mergedPdfBytes));
  } catch (error) {
    console.error("Error merging reports:", error);
    return res.status(500).json({ error: "Failed to merge reports" });
  }
};
const getJobResultCompare = async (req, res) => {
  try {
    const { job_pk } = req.params;

    // 1️⃣ New Job
    const newJob = await Jobs.findByPk(job_pk);

    if (!newJob || !newJob.parent_job_pk) {
      return res.json({ data: [] });
    }

    // 2️⃣ Old Job
    const oldJob = await Jobs.findByPk(newJob.parent_job_pk);

    if (!oldJob || !oldJob.jdata || !newJob.jdata) {
      return res.json({ data: [] });
    }

    const oldData = JSON.parse(oldJob.jdata);
    const newData = JSON.parse(newJob.jdata);

    const comparison = compareJdata(oldData, newData);

    return res.json({ data: comparison });
  } catch (error) {
    console.error("compare error:", error);
    return res.status(500).json({ error: "Failed to compare results" });
  }
};
const compareJdata = (oldData, newData) => {
  const output = [];

  oldData.forEach((oldTest) => {
    const newTest = newData.find((n) => n.param_id === oldTest.param_id);

    if (!newTest) return;

    oldTest.reportData.forEach((oldRow) => {
      const newRow = newTest.reportData.find((r) => r.key === oldRow.key);

      if (!newRow) return;

      const oldVal = oldRow.value;
      const newVal = newRow.value;

      let diff = "0";

      if (!isNaN(oldVal) && !isNaN(newVal)) {
        diff = (Number(newVal) - Number(oldVal)).toFixed(3);
      } else if (oldVal !== newVal) {
        diff = "Changed";
      }

      output.push({
        param: oldRow.key,
        old_value: oldVal,
        new_value: newVal,
        difference: diff,
      });
    });
  });

  return output;
};

const submitJob = async (req, res) => {
  const { emp_id } = req;
  const { jId, jdata, start_date, end_date, remarks } = req.body;

  console.log(req.body, "jdata45");

  try {
    const job = await Jobs.findOne({
      where: { job_pk: jId },
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Product,
              as: "product",
            },
            {
              model: Orders,
              as: "order",
              include: [
                {
                  model: Customers,
                  as: "customer",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // if (job.emp_id !== emp_id) {
    //   return res
    //     .status(403)
    //     .json({ error: "Unauthorized access: You cannot submit this job" });
    // }

    //write your report logic here
    const jobInfo = job;
    // const orderInfo = job.sampleDetails.order;
    const orderInfo = job.sampleDetails?.order || null;

    const reportingAddFromOrder = orderInfo.reporting_address
      ? orderInfo.reporting_address
      : "Reference not mentioned";

    const sampleInfo = job.sampleDetails;
    const customerInfo = job.sampleDetails.order.customer;

    const productInfo = await Product.findByPk(sampleInfo.product_id, {
      attributes: ["name", "id"],
    });

    const reportFunParams = {
      jobInfo,
      orderInfo,
      customerInfo,
      sampleInfo,
      productInfo,
      jdata,
      reportingAddFromOrder,
    };

    // if (job.discipline === CHEMICAL && !job.nabl) {
    //   await getNonNablChemicalReport(
    //     reportFunParams,
    //     jId,
    //     start_date,
    //     end_date
    //   );
    // } else if (job.discipline === PHYSICAL && job.nabl) {
    //   await nablMechanical(reportFunParams, jId, start_date, end_date);
    // } else if (job.discipline === PHYSICAL && !job.nabl) {
    //   await getNABLPhysicalNonNablReport(reportFunParams);
    // }

    if (job.status === 2) {
      deleteS3Obj(
        process.env.JOB_REPORTS || "tb-kdm-job-reports",
        `${jId}.pdf`,
      );
    }

    const dbResponse = await job.update({
      jdata,
      dos: new Date(), //set date here
      status: 2,
      start_date,
      end_date,
      analyst_sign: emp_id,
      remarks,
    });
    // return res.status(200).json();

    return res.status(200).json({
      message: "Values stored",
      data: dbResponse,
      orderInfo,
      sampleInfo,
      customerInfo,
      jobInfo,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return res
      .status(500)
      .json({ error: "Failed to submit values, please try again" });
  }
};

const dispatchJob = async (req, res) => {
  const { jId } = req.body;

  const t = await sequelize.transaction();
  try {
    if (!jId) {
      return res.status(400).json({ error: "Job ID is required" });
    }
    const job = await Jobs.findOne({ where: { job_pk: jId } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    await Jobs.update(
      {
        status: 10, //10 = job is dispatched
        job_dispatched_at: new Date(),
        dispatch_job: true,
        manager_sign: req.emp_id,
      },
      { where: { job_pk: jId }, transaction: t },
    );

    const log = {
      lc_id: 1,
      description: `report-${jId}.pdf is ready to deliver to client`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };

    await createAlog(log, t);
    await t.commit();
    return res.status(200).json({
      message: "Job dispatched successfully",
      jId,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error dispatching job:", error);
    return res.status(500).json({ error: "Error Dispatching Job" });
  }
};

const updateJobColumn = async (req, res) => {
  const { job_pk, column, value } = req.body;

  console.log(req.body, "column675");

  const t = await sequelize.transaction();
  try {
    if (!job_pk || !column || value === undefined) {
      return res.status(400).json({
        error: "job_pk, column, and value are required",
      });
    }

    // Check if column is valid (to avoid SQL injection)
    const validColumns = [
      "sample_id",
      "emp_id",
      "report",
      "doa",
      "dos",
      "status",
      "job_id",
      "discipline",
      "nabl",
      "params_json",
      "jdata",
      "job_dispatched_at",
      "report_dispatched_at",
      "dispatch_job",
      "report_approval",
      "start_date",
      "end_date",
    ];
    if (!validColumns.includes(column)) {
      return res.status(400).json({ error: `Invalid column name: ${column}` });
    }

    // Check if job exists
    const job = await Jobs.findOne({ where: { job_pk } });
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Update dynamically
    await Jobs.update(
      { [column]: value },
      { where: { job_pk }, transaction: t },
    );

    // Create log
    const log = {
      lc_id: 1,
      description: `Updated ${column} of job_pk ${job_pk} to ${value}`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };
    await createAlog(log, t);

    await t.commit();
    return res.status(200).json({
      message: `Updated ${column} successfully`,
      job_pk,
      column,
      value,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating job column:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const repeatSampleToNewOrder = async (req, res) => {
  console.log("🔥 repeatSampleToNewOrder HIT");

  try {
    const { sample_id } = req.body;

    // 1️⃣ Get sample
    const sample = await SampleMaterials.findOne({ where: { sample_id } });
    if (!sample) return res.status(404).json({ error: "Sample not found" });

    // 2️⃣ Get old order
    const oldOrder = await Orders.findByPk(sample.order_id);
    if (!oldOrder)
      return res.status(404).json({ error: "Old order not found" });

    let nextOrderNumber = null;
    let nextOrderCode = null;

    // ===========================
    // ✅ SAME LOGIC AS getAllOrdersHighNums
    // ===========================

    if (oldOrder.division === "GT") {
      const latestGTOrder = await Orders.findOne({
        where: {
          division: "GT",
          order_code: { [Op.ne]: null },
        },
        order: [
          [
            Sequelize.literal("CAST(SUBSTRING(order_code, 3) AS UNSIGNED)"),
            "DESC",
          ],
        ],
        attributes: ["order_code"],
      });

      let code = "GT1";

      if (latestGTOrder?.order_code) {
        const match = latestGTOrder.order_code.match(/GT(\d+)/);
        if (match) {
          code = `GT${parseInt(match[1]) + 1}`;
        }
      }

      nextOrderCode = code;
    } else {
      // LAB or NDT
      const latestLABOrder = await Orders.findOne({
        where: {
          division: { [Op.or]: ["LAB", "NDT"] },
          order_number: { [Op.ne]: null },
        },
        order: [[Sequelize.literal("CAST(order_number AS UNSIGNED)"), "DESC"]],
        attributes: ["order_number"],
      });

      nextOrderNumber = parseInt(latestLABOrder?.order_number || 0) + 1;
    }

    // ===========================
    // 3️⃣ Create New Order
    // ===========================

    const newOrder = await Orders.create({
      customer_id: oldOrder.customer_id,
      division: oldOrder.division,
      order_number: nextOrderNumber,
      order_code: nextOrderCode,
      pn: oldOrder.pn,
      amount: 0,
      discount: 0,
      parent_order_id: oldOrder.order_id,
      mode: oldOrder.mode,
    });

    // ===========================
    // 4️⃣ Clone Jobs
    // ===========================

    const jobs = await Jobs.findAll({ where: { sample_id } });

    for (const job of jobs) {
      await Jobs.create({
        order_id: newOrder.order_id,
        sample_id,
        discipline: job.discipline,
        nabl: job.nabl,
        params_json: job.params_json,
        parent_job_pk: job.job_pk,
        status: 0,
      });
    }

    // ===========================
    // 5️⃣ Response
    // ===========================

    return res.json({
      message: "New order created with sample",
      new_order_id: newOrder.order_id,
      order_number: nextOrderNumber,
      order_code: nextOrderCode,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Repeat sample failed" });
  }
};

const updateReportApproval = async (req, res) => {
  const { job_pk, report_approval } = req.body;

  if (!job_pk || typeof report_approval !== "boolean") {
    return res.status(400).json({
      error: "job_pk and report_approval (boolean) are required",
    });
  }

  const t = await sequelize.transaction();

  try {
    // Generate / ensure final report
    await getUltraFinalReport(job_pk);

    const jobResult = await Jobs.findOne({
      where: { job_pk },
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          include: [
            {
              model: Orders,
              as: "order",
              include: [
                {
                  model: Customers,
                  as: "customer",
                },
              ],
            },
            {
              model: Product,
              as: "product",
            },
          ],
        },
      ],
    });

    if (!jobResult) {
      return res.status(404).json({ error: "Job not found" });
    }

    /* ------------------------------------------------------------------
       1️⃣ JOB LEVEL DESTRUCTURING
    ------------------------------------------------------------------ */
    const { job_pk: jobPk, reportLocation } = jobResult.dataValues;

    /* ------------------------------------------------------------------
       2️⃣ SAMPLE → PRODUCT → ORDER → CUSTOMER
    ------------------------------------------------------------------ */
    const { product, order } = jobResult.sampleDetails.dataValues;

    const { name: materialName } = product?.dataValues || {};

    const { billing_name, mobile, email } = order.customer.dataValues;

    const message = `
Hi ${billing_name},

✅ Your test report is ready.

🧪 Material: ${materialName || "N/A"}

📄 Download your report:
${reportLocation}

Thank you for choosing
*KDM Engineers India (Pvt) Ltd*
`;

    if (mobile) {
      await sendWhatsAppMessage(mobile, message);
    } else {
      console.warn("⚠️ Customer mobile number not available");
    }
    /* ------------------------------------------------------------------
       5️⃣ ACTIVITY LOG
    ------------------------------------------------------------------ */
    await createAlog(
      {
        lc_id: 1,
        description: `Report approved for job_pk ${jobPk}`,
        logged_by: req.emp_id,
        ip: getIp(req),
      },
      t,
    );

    await t.commit();

    return res.status(200).json({
      message: "Report approval updated successfully",

      customer: billing_name,
      material: materialName,
    });
  } catch (err) {
    await t.rollback();
    console.error("❌ updateReportApproval error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllReadyToDispatchReports = async (req, res) => {
  try {
    // Fetch jobs with status = 10
    const jobs = await Jobs.findAll({
      where: { status: 10 },
      attributes: [
        "report",
        "job_pk",
        "job_id",
        "params_json",
        "job_dispatched_at",
        "report_dispatched_at",
        "report_approval",
        "ulrData",
        "reportIssueDate",
      ],
      include: [
        {
          model: SampleMaterials,
          as: "sampleDetails",
          attributes: ["sample_id", "sample_code", "product_id"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["name"],
            },
            {
              model: Orders,
              attributes: [
                "order_id",
                "customer_id",
                "converted_to_tax",
                "order_number",
              ],
              as: "order",
            },
          ],
        },
      ],
    });

    // Convert jobs object to plain object for manipulation
    const jobsPlain = jobs.map((job) => job.get({ plain: true }));

    // Loop through each job to fetch params details
    for (const job of jobsPlain) {
      if (job.params_json) {
        job.paramDetails = await getParamsDetails(job.params_json);
      }
    }

    return res.status(200).json({
      data: jobsPlain,
    });
  } catch (error) {
    console.error("Fetching ready-to-dispatch reports error:", error);
    return res
      .status(500)
      .json({ error: "Error fetching ready-to-dispatch reports" });
  }
};
const checkULRExists = async (req, res) => {
  try {
    const { urlNumber } = req.body;

    if (!urlNumber) {
      return res.json({ exists: false });
    }

    // Check in Jobs table by ulrData field
    const job = await Jobs.findOne({
      where: { ulrData: urlNumber },
      attributes: ["job_pk", "job_id"],
    });

    return res.json({
      exists: job ? true : false,
    });
  } catch (error) {
    console.error("ULR check error:", error);
    return res.status(500).json({ exists: false });
  }
};

const requestToRetakeTest = async (req, res) => {
  const { jId } = req.body;
  const t = await sequelize.transaction();
  try {
    await Jobs.update(
      { status: 3, jdata: null },
      { where: { job_pk: jId }, transaction: t },
    ); // 3 stands for request to retake test

    const log = {
      lc_id: 8,
      description: `${req.emp_id} requested to retake test of ${jId}`,
      logged_by: req.emp_id,
      ip: getIp(req),
    };
    await createAlog(log, t);
    await t.commit();
    return res.status(200).json({
      message: "Request has been sent",
      jId,
    });
  } catch (error) {
    await t.rollback();
    console.error("Failed to send request to retake test:", error);
    return res.status(500).json({ error: "Error requesting to retake test" });
  }
};

const resetJob = async (req, res) => {
  const { jId } = req.body;
  //cases
  //job is existed or not
  //deleting s3 object
  //checking weather it is dispatched or not
  try {
    const job = await Jobs.findOne({
      where: { job_pk: jId },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.status === 2) {
      deleteS3Obj(
        process.env.JOB_REPORTS || "tb-kdm-job-reports",
        `${jId}.pdf`,
      );
    }

    if (job.status === 10) {
      return res.status(500).json({ error: "Job is already dispatched" });
    }

    await job.update({
      jdata: null,
      dos: null, //set date here
      status: 1,
    });

    return res.status(200).json({
      message: "Test form is reset, please refresh and submit new values",
    });
  } catch (error) {
    console.error("Failed to Reset test data form:", error);
    return res.status(500).json({ error: "Failed to Reset test data form" });
  }
};
const repeatSampleJobs = async (req, res) => {
  try {
    const { sample_id } = req.body;

    const jobs = await Jobs.findAll({ where: { sample_id } });

    if (!jobs.length) {
      return res.status(404).json({ error: "No jobs found" });
    }

    const createdJobs = [];

    for (const job of jobs) {
      const newJob = await Jobs.create({
        order_id: job.order_id, // keep same order
        sample_id: job.sample_id,
        discipline: job.discipline,
        nabl: job.nabl,
        params_json: job.params_json,
        parent_job_pk: job.job_pk, // link
        status: 0,
      });

      createdJobs.push(newJob);
    }

    return res.json({
      message: "All sample jobs repeated",
      data: createdJobs,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Repeat failed" });
  }
};

module.exports = {
  getPendingAssigningOrders,
  getAllAnalyst,
  repeatSampleJobs,
  assignSamplesToAnalyst,
  getAllMyJobs,
  getRegisterdButPendingAssignedSamples,
  assignJobToAnalyst,
  getSamplesInProgress,
  getJobParamsDetails,
  submitJob,
  repeatJob,
  getJobResultCompare,
  dispatchJob,
  getAllReadyToDispatchReports,
  checkULRExists,
  submitEquip,
  getAllEquip,
  getEquipProfile,
  requestToRetakeTest,
  resetJob,
  getMyReport,
  getMyRORReport,
  updateJobColumn,
  updateReportApproval,
  mergeReports,
  repeatSampleToNewOrder,
  updateEquip,
  repeatFullOrder,
};

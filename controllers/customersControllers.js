const {
  Customers,
  sequelize,
  Orders,
  SampleMaterials,
  SampleParams,
  Client,
  GstRecords,
  Vendor,
  PurchaseOrder,
  PoDocument,
  VendorLedger,
} = require("../models/index");
const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

// const getAllCustomers = async (req, res) => {
//   const t = await sequelize.transaction();
//   try {
//     const customers = await Customers.findAll({
//       order: [["billing_name", "ASC"]],
//     });

//     const clients = await Client.findAll({
//       order: [["reporting_name", "ASC"]],
//     });

//     await t.commit();
//     console.log(customers[0], 'hjgjg')
//         console.log(clients, 'kphb')

//     res.status(200).json({ data: customers });
//   } catch (error) {
//     await t.rollback();
//     res.status(500).json({ message: "Failed to fetch Customers Data" });
//   }
// };

const getAllCustomers = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const customers = await Customers.findAll({
      order: [["billing_name", "ASC"]],
      raw: true,
    });

    const clientList = await Client.findAll({ raw: true });

    const customersWithClients = customers.map((customer) => ({
      ...customer,
      clients: clientList.filter((c) => c.customer_id === customer.customer_id),
    }));

    await t.commit();
    res.status(200).json({ data: customersWithClients });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: "Failed to fetch Customers Data" });
  }
};

const getAllVendors = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const vendors = await Vendor.findAll({
      order: [["vendor_name", "ASC"]],
      raw: true,
    });

    await t.commit();
    console.log(vendors, "v87");
    res.status(200).json({
      message: "Vendors fetched successfully",
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    await t.rollback();

    res.status(500).json({
      message: "Failed to fetch vendor data",
      error: error.message,
    });
  }
};

//order registration/update form

// const getCustomerInfoById = async (req, res) => {
//   const t = await sequelize.transaction();

//   const { customer_id } = req.params;

//   try {
//     const customer = await Customers.findByPk(customer_id);
//     await t.commit();
//     res.status(200).json({ data: customer });
//   } catch (error) {
//     await t.rollback();
//     res.status(500).json({ message: "Failed to fetch Customers Data" });
//   }
// };

const getCustomerInfoById = async (req, res) => {
  const { customer_id } = req.params;

  try {
    const customer = await Customers.findByPk(customer_id, {
      include: [
        {
          model: GstRecords,
          as: "gst_records", // alias must match your association if you used one
          attributes: ["gst", "bill_address", "created_at"],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json({ data: customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch Customers Data" });
  }
};

// const addCustomer = async (req, res) => {
//   const t = await sequelize.transaction();

//   const {
//     reporting_name,
//     reporting_address,
//     billing_name,
//     billing_address,
//     email,
//     mobile,
//     pan,
//     gst,
//     discount,
//     project_info,
//     extra_gsts,
//   } = req.body;

//   const customer_id = uuidv4();

//   try {
//     const newCustomer = {
//       reporting_name,
//       reporting_address,
//       billing_name,
//       billing_address,
//       email,
//       mobile,
//       pan,
//       gst,
//       discount,
//       project_info,
//     };

//     const customer = await Customers.create(newCustomer, {
//       transaction: t,
//     });

//     const customerId = customer.get("customer_id");

//     // Insert extra GST + billing address + pan_id records
//     if (extra_gsts && extra_gsts.length > 0) {
//       const gstRecords = extra_gsts.map((g) => ({
//         gst: g.gst,
//         bill_address: g.billing_address,
//         pan_id: g.pan, // ✅ coming from frontend auto-filled logic
//         customer_id: customerId,
//       }));

//       await GstRecords.bulkCreate(gstRecords, { transaction: t });
//     }

//     await t.commit();

//     return res.status(200).json({
//       message: "Customer added successfully",
//       data: { ...req.body, customer_id: customerId },
//     });
//   } catch (err) {
//     console.error("Error in addCustomer:", err);
//     await t.rollback();
//     return res.status(500).json({ message: "Failed to register the Customer" });
//   }
// };

const addCustomer = async (req, res) => {
  const t = await sequelize.transaction();
  const {
    reporting_name,
    reporting_address,
    billing_name,
    billing_address,
    email,
    mobile,
    pan,
    gst,
    discount,
    project_info,
    extra_gsts,
    additional_contacts,
    additional_emails,
  } = req.body;

  const customer_id = uuidv4();

  try {
    const newCustomer = {
      reporting_name,
      reporting_address,
      billing_name,
      billing_address,
      email,
      mobile,
      pan,
      gst,
      discount,
      project_info,
      additional_contacts: additional_contacts || [], // ✅ store array
      additional_emails: additional_emails || [], // ✅ store array
    };

    const customer = await Customers.create(newCustomer, {
      transaction: t,
    });

    const customerId = customer.get("customer_id");

    // Insert extra GST + billing address + pan_id records
    if (extra_gsts && extra_gsts.length > 0) {
      const gstRecords = extra_gsts.map((g) => ({
        gst: g.gst,
        bill_address: g.billing_address,
        pan_id: g.pan, // ✅ coming from frontend auto-filled logic
        customer_id: customerId,
      }));

      await GstRecords.bulkCreate(gstRecords, { transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      message: "Customer added successfully",
      data: { ...req.body, customer_id: customerId },
    });
  } catch (err) {
    console.error("Error in addCustomer:", err);
    await t.rollback();
    return res.status(500).json({ message: "Failed to register the Customer" });
  }
};

const addVendor = async (req, res) => {
  const t = await sequelize.transaction();
  console.log(req.body, "hj87");
  try {
    const {
      vendor_name,
      contact_person,
      email,
      gst,
      subject,
      vendor_address,
      client_bkg,
    } = req.body;

    // ✅ Basic validation
    if (!vendor_name) {
      return res.status(400).json({ message: "Vendor name is required" });
    }

    // ✅ Create a new vendor record
    const newVendor = await Vendor.create(
      {
        vendor_name,
        contact_person,
        email: email || "",
        gst: gst || "",
        subject: subject || "",
        vendor_address: vendor_address || "",
        client_bkg: client_bkg || "",
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      message: "Vendor added successfully",
      data: newVendor,
    });
  } catch (error) {
    console.error("Error adding vendor:", error);
    await t.rollback();
    return res.status(500).json({
      message: "Failed to add vendor",
      error: error.message,
    });
  }
};

const addClient = async (req, res) => {
  const t = await sequelize.transaction();

  const {
    client_id,
    customer_id,
    reporting_name,
    reporting_address,
    project_info,
  } = req.body;

  if (!customer_id) {
    return res.status(400).json({ message: "customer_id is required" });
  }
  if (!reporting_name || !reporting_address) {
    return res
      .status(400)
      .json({ message: "reporting_name and reporting_address are required" });
  }

  try {
    const clientData = {
      customer_id,
      reporting_name,
      reporting_address,
      project_info,
    };

    let result;

    if (client_id) {
      // ✅ Update existing client
      const [updatedRowsCount] = await Client.update(clientData, {
        where: { client_id },
        transaction: t,
      });

      if (updatedRowsCount === 0) {
        await t.rollback();
        return res.status(404).json({ message: "Client not found for update" });
      }

      result = await Client.findOne({ where: { client_id }, transaction: t });
    } else {
      // ✅ Create new client
      result = await Client.create(clientData, { transaction: t });
    }

    await t.commit();

    return res.status(200).json({
      message: client_id
        ? "Client updated successfully"
        : "Client added successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error adding/updating client:", err);
    await t.rollback();
    return res.status(500).json({ message: "Failed to process the Client" });
  }
};

// const addClient = async (req, res) => {
//   const t = await sequelize.transaction();

//   // console.log("Triggered");

//   const {
//     client_id,
//     customer_id,
//     reporting_name,
//     reporting_address,
//     billing_name,
//     billing_address,
//     email,
//     mobile,
//     pan,
//     gst,
//     discount,
//   } = req.body;

//   if (!customer_id) {
//     return res.status(400).json({ message: "customer_id is required" });
//   }

//   try {
//     const clientData = {
//       customer_id,
//       reporting_name,
//       reporting_address,
//       billing_name,
//       billing_address,
//       email,
//       mobile,
//       pan,
//       gst,
//       discount,
//     };

//     let result;

//     if (client_id) {
//       // ✅ Update existing client
//       const [updatedRowsCount] = await Client.update(clientData, {
//         where: { client_id },
//         transaction: t,
//       });

//       if (updatedRowsCount === 0) {
//         await t.rollback();
//         return res.status(404).json({ message: "Client not found for update" });
//       }

//       result = await Client.findOne({ where: { client_id }, transaction: t });
//     } else {
//       // ✅ Create new client
//       result = await Client.create(clientData, { transaction: t });
//     }

//     await t.commit();

//     return res.status(200).json({
//       message: client_id
//         ? "Client updated successfully"
//         : "Client added successfully",
//       data: result,
//     });
//   } catch (err) {
//     console.error("Error adding/updating client:", err);
//     await t.rollback();
//     return res.status(500).json({ message: "Failed to process the Client" });
//   }
// };

const getClientsByCustomerId = async (req, res) => {
  const { customer_id } = req.query;
  // console.log("trigerred55478");
  // console.log(customer_id, 'customer_idcustomer_id')

  if (!customer_id) {
    return res.status(400).json({ message: "customer_id is required" });
  }

  try {
    const clients = await Client.findAll({
      where: { customer_id },
    });

    // if (clients.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ message: "No clients found for this customer_id" });
    // }
    // console.log(clients, 'sending clients to user end')
    return res.status(200).json({
      message: "Clients fetched successfully",
      data: clients,
    });
  } catch (err) {
    console.error("Error fetching clients:", err);
    return res.status(500).json({ message: "Failed to fetch clients" });
  }
};

const getCustomerPartialInfo = async (req, res) => {
  try {
    const gstWithCustomers = await Customers.findAll({
      attributes: [
        "reporting_name",
        "gst",
        "customer_id",
        "pan",
        "project_info",
      ],
      include: [
        {
          model: GstRecords,
          as: "gst_records",
          attributes: ["gst"],
        },
      ],
    });

    // Transform the response to flatten extra_gsts
    const formattedData = gstWithCustomers.map((cust) => {
      const json = cust.toJSON();
      return {
        ...json,
        extra_gsts: json.extra_gsts?.map((g) => g.gst) || [],
      };
    });

    return res.status(200).json({
      data: formattedData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message:
        "Internal server error: something went wrong in fetching gst numbers and associated customers",
    });
  }
};

// const getCustomerPartialInfo = async (req, res) => {
//   try {
//     const gstWithCustomers = await Customers.findAll({
//       attributes: ["reporting_name", "gst", "customer_id", "pan", "project_info"],
//     });
//     return res.status(200).json({
//       data: gstWithCustomers,
//     });
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({
//       message:
//         "Internal server error something went wrong in fetching gst numbers and associated customers",
//     });
//   }
// };

const updateCustomerById = async (req, res) => {
  const { customer_id } = req.params;
  const t = await sequelize.transaction();

  try {
    const {
      reporting_name,
      reporting_address,
      billing_name,
      billing_address,
      email,
      mobile,
      pan,
      gst,
      discount,
      project_info,
      extra_gsts,
      additional_emails,
      additional_contacts,
    } = req.body;

    const updatedInfo = {
      reporting_name,
      reporting_address,
      billing_name,
      billing_address,
      email,
      mobile,
      pan,
      gst,
      discount,
      project_info,
      additional_emails,
      additional_contacts,
    };

    await Customers.update(updatedInfo, { where: { customer_id } });

    // 🧾 Handle extra_gsts update
    if (Array.isArray(extra_gsts)) {
      // 1️⃣ Delete old GST records for this customer
      await GstRecords.destroy({ where: { customer_id }, transaction: t });

      // 2️⃣ Insert new GST records if provided
      if (extra_gsts.length > 0) {
        const gstRecords = extra_gsts.map((g) => ({
          gst: g.gst,
          bill_address: g.billing_address,
          pan_id: g.pan,
          customer_id,
          created_at: new Date(),
        }));
        await GstRecords.bulkCreate(gstRecords, { transaction: t });
      }
    }

    await t.commit();
    return res.status(200).json({
      message: "Customer record updated succesfully ",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to update customer record",
    });
  }
};

const updateVendorById = async (req, res) => {
  const { vendor_id } = req.params; // vendor_id from URL params
  const t = await sequelize.transaction();

  try {
    const {
      vendor_name,
      contact_person,
      email,
      gst,
      client_bkg,
      subject,
      vendor_address,
    } = req.body;

    const updatedData = {
      vendor_name,
      contact_person,
      email,
      gst,
      client_bkg,
      subject,
      vendor_address,
    };

    // ✅ Update Vendor record
    const [updatedCount] = await Vendor.update(updatedData, {
      where: { id: vendor_id },
      transaction: t,
    });

    if (updatedCount === 0) {
      await t.rollback();
      return res.status(404).json({ message: "Vendor not found" });
    }

    await t.commit();
    return res
      .status(200)
      .json({ message: "Vendor record updated successfully" });
  } catch (err) {
    console.error("Error updating vendor:", err);
    await t.rollback();
    return res.status(500).json({ message: "Failed to update vendor record" });
  }
};

// const getCustomerInfoUsingID = async (customerId, t) => {
//   try {
//     const customer = await Customers.findByPk(customerId, { transaction: t });
//     const queryRes = customer.toJSON();
//     const {
//       reporting_name,
//       reporting_address,
//       pan,
//       gst,
//       billing_address,
//       billing_name,
//       mobile,
//       discount,
//       email,project_info
//     } = queryRes;
//     const res = {
//       name: reporting_name,
//       address: reporting_address,
//       pan_number: pan,
//       gst_number: gst,
//       billing_address,
//       billing_name,
//       reporting_address,
//       reporting_name,
//       pan,
//       gst,
//       mobile,
//       discount,
//       email,project_info
//     };
//     if (!customer) {
//       throw new Error("Customer not found");
//     }
//     return res;
//   } catch (error) {
//     console.error("Error fetching customer :", error);
//     throw error;
//   }
// };

const getCustomerInfoUsingID = async (customerId, t) => {
  try {
    // Fetch the customer and include gst_records
    const customer = await Customers.findByPk(customerId, {
      transaction: t,
      include: [
        {
          model: GstRecords,
          as: "gst_records", // alias must match your association
          attributes: ["gst", "bill_address", "pan_id"],
        },
      ],
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const queryRes = customer.toJSON();
    const {
      reporting_name,
      reporting_address,
      pan,
      gst,
      billing_address,
      billing_name,
      mobile,
      discount,
      email,
      project_info,
      additional_contacts,
      additional_emails,
      gst_records = [], // fallback if no gst_records
    } = queryRes;

    // Map gst_records to extract GST + bill_address + pan_id
    const extra_gsts = gst_records.map((record) => ({
      gst: record.gst,
      bill_address: record.bill_address,
      pan_id: record.pan_id,
    }));

    // Build response object
    const res = {
      name: reporting_name,
      address: reporting_address,
      pan_number: pan,
      gst_number: gst,
      billing_address,
      billing_name,
      reporting_address,
      reporting_name,
      pan,
      gst,
      mobile,
      discount,
      email,
      project_info,
      additional_emails,
      additional_contacts,
      extra_gsts, // 👉 full objects now
    };

    return res;
  } catch (error) {
    console.error("Error fetching customer:", error);
    throw error;
  }
};

const getIthCustomerOrders = async (customerId, t) => {
  try {
    const orders = await Orders.findAll({
      where: { customer_id: customerId },
      order: [["dor", "DESC"]],
      attributes: [
        "project_name",
        "letter",
        "dor",
        "order_id",
        "pn",
        "order_number",
        "proforma",
        "converted_to_tax",
        "tax_number",
        "tax_file",
      ],
      transaction: t,
    });

    const result = orders.map((order) => order.toJSON());
    return result;
  } catch (error) {
    console.error("Error fetching customer orders: ", error);
    throw error;
  }
};

const getTotalOrderscountTotalAmountOfIthCustomer = async (customerId, t) => {
  try {
    const result = await Orders.findAll({
      where: {
        customer_id: customerId,
      },
      attributes: [
        [
          sequelize.fn("COUNT", sequelize.col("Orders.order_id")),
          "order_count",
        ],
        [sequelize.fn("SUM", sequelize.col("Orders.amount")), "total_amount"],
      ],

      raw: true,
      group: ["Orders.customer_id"],
    });

    // console.log(result);
    if (result.length > 0) {
      const { order_count, total_amount } = result[0];
      const finalObj = { order_count, total_amount };
      return finalObj;
    } else {
      return { order_count: 0, total_amount: 0 };
    }
  } catch (err) {
    console.error("Error fetching customer orders: ", err);
    throw err;
  }
};

const getIthCustomerSamples = async (customerId, t) => {
  try {
    const sampleMaterials = await SampleMaterials.findAll({
      include: [
        {
          model: Orders,
          as: "order",
          where: { customer_id: customerId },
          attributes: [],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return sampleMaterials;
  } catch (error) {
    console.error("Error fetching sample materials:", error);
    throw error;
  }
};

// const getTotalNumberOfParamsOfIthCustomers = async (customerId) => {
//   try {
//     const totalParams = await SampleParams.count({
//       include: [
//         {
//           model: SampleMaterials,
//           as: "sample",
//           include: [
//             {
//               model: Orders,
//               as: "orders",
//               where: { customer_id: customerId }, // Filter by customer ID
//               attributes: [], // Exclude unnecessary fields
//             },
//           ],
//         },
//       ],
//       distinct: true, // Ensures counting distinct params
//     });

//     return totalParams;
//   } catch (error) {
//     console.error("Error fetching total sample parameters:", error);
//     throw error;
//   }
// };

const getVendorLedger = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { vendor_id } = req.params;
    console.log(vendor_id, "vendor_id786");

    /* 1️⃣ Fetch Vendor by vendor_id */
    const vendor = await Vendor.findOne({
      where: { id: vendor_id },
      transaction: t,
    });

    if (!vendor) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const ledgerEntries = await VendorLedger.findAll({
      where: { vendor_id },
      order: [["created_at", "DESC"]],
      transaction: t,
    });

    console.log(ledgerEntries, "vendor786");

    /* 2️⃣ Fetch Purchase Orders using vendor_name */
    const purchaseOrders = await PurchaseOrder.findAll({
      where: {
        vendor_name: vendor.vendor_name,
      },
      include: [
        {
          model: PoDocument,
          as: "documents",
          required: false,
        },
      ],
      order: [
        ["created_at", "DESC"],
        [{ model: PoDocument, as: "documents" }, "doc_date", "DESC"],
      ],
      transaction: t,
    });

    await t.commit();

    //     const documents = purchaseOrders.flatMap((po) =>
    //   (po.documents || []).map((doc) => doc.get({ plain: true }))
    // );

    const responseData = ledgerEntries.map((entry) => ({
      rec_id: entry.id,
      vendor_id: entry.vendor_id,
      po_date: entry.po_date,
      bill_data: entry.bill_data,
    }));

    const documents = purchaseOrders.flatMap((po) =>
      (po.documents || []).map((doc) => ({
        ...doc.get({ plain: true }),
        po_number: po.po_number,
        po_id: po.po_id,
      })),
    );

    console.log(documents, "purchaseOrders786");

    /* 3️⃣ Final Response */
    return res.status(200).json({
      success: true,
      vendor: {
        id: vendor.id,
        vendor_name: vendor.vendor_name,
        gst: vendor.gst,
        contact_person: vendor.contact_person,
      },
      documents,
      responseData,
    });
  } catch (error) {
    await t.rollback();
    console.error("Vendor Ledger Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor ledger",
      error: error.message,
    });
  }
};

const getIthCustomerReport = async (req, res) => {
  const t = await sequelize.transaction();
  const { customer_id } = req.params;

  try {
    const ithCustomerOrders = await getIthCustomerOrders(customer_id, t);
    const ithCustomer = await getCustomerInfoUsingID(customer_id, t);
    const ithCustomerTotalStats =
      await getTotalOrderscountTotalAmountOfIthCustomer(customer_id, t);
    const ithCustomerSamples = await getIthCustomerSamples(customer_id, t);

    const result = {
      ithCustomerTotalStats,
      ithCustomerOrders,
      ithCustomer,
      ithCustomerSamples,
    };
    await t.commit();
    return res.status(200).json({ data: result });
  } catch (err) {
    await t.rollback();
    console.log("error while fetching ith customer report", err);
    return res.status(500).json({ error: "internal server error" });
  }
};

const getCustomerByCustomerId = async (customerId, t) => {
  try {
    console.log("fetching customer information by id", customerId);
    const customerInfo = await Customers.findByPk(customerId, {
      transaction: t,
    });
    return customerInfo;
  } catch (err) {
    console.log("Error Fetching customer data by id");
    throw err;
  }
};

module.exports = {
  getAllCustomers,
  getCustomerInfoById,
  addCustomer,
  addVendor,
  getAllVendors,
  getCustomerPartialInfo,
  updateCustomerById,
  getCustomerInfoUsingID,
  getIthCustomerReport,
  getCustomerByCustomerId,
  addClient,
  getClientsByCustomerId,
  updateVendorById,
  getVendorLedger,
};

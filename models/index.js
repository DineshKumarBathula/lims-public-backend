"use strict";
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const basename = path.basename(__filename);
const config = require("../config/config")[env];
const db = {};
let sequelize;

try {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
  sequelize
    .authenticate()
    .then(() => {
      console.log("Connection has been established successfully.");
    })
    .catch((err) => {
      console.error("Unable to connect to the database:", err);
    });
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      file.indexOf(".test.js") === -1
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

const User = require("./User")(sequelize, Sequelize.DataTypes);
const Cart = require("./Cart")(sequelize, Sequelize.DataTypes);
const Subscriber = require("./Subscribers")(sequelize, Sequelize.DataTypes);
const Callback = require("./Callbacks")(sequelize, Sequelize.DataTypes);
const Orders = require("./Orders")(sequelize, Sequelize.DataTypes);
const Product = require("./Product")(sequelize, Sequelize.DataTypes);
const Params = require("./Params")(sequelize, Sequelize.DataTypes);
const Employee = require("./Employee")(sequelize, Sequelize.DataTypes);
const Branch = require("./Branch")(sequelize, Sequelize.DataTypes);
const Department = require("./Department")(sequelize, Sequelize.DataTypes);
const Role = require("./Role")(sequelize, Sequelize.DataTypes);
const AccessKey = require("./AccessKeys")(sequelize, Sequelize.DataTypes);
const Tickets = require("./Tickets")(sequelize, Sequelize.DataTypes);
const Leaves = require("./Leaves")(sequelize, Sequelize.DataTypes);
const Inventory = require("./Inventory")(sequelize, Sequelize.DataTypes);
// const WorkOrder = require("./WorkOrder")(sequelize, Sequelize.DataTypes);
// const LogsCategory = require("./LogsCategory")(sequelize, Sequelize.DataTypes);
// const NdtQuotation = require("./NdtQuotation")(sequelize, Sequelize.DataTypes);
const Feedback = require("./Feedback")(sequelize, Sequelize.DataTypes);
const WorkOrder = require("./WorkOrder")(sequelize, Sequelize.DataTypes);
const WoDocument = require("./WoDocument")(sequelize, Sequelize.DataTypes);

const LogsCategory = require("./LogsCategory")(sequelize, Sequelize.DataTypes);
const NdtQuotation = require("./NdtQuotation")(sequelize, Sequelize.DataTypes);
const GtQuotation = require("./gtQuotation")(sequelize, Sequelize.DataTypes);

const PurchaseOrder = require("./PurchaseOrder")(
  sequelize,
  Sequelize.DataTypes,
);
const PoDocument = require("./PoDocument")(sequelize, Sequelize.DataTypes);

const SampleMaterialFields = require("./SampleMaterialFields")(
  sequelize,
  Sequelize.DataTypes,
);
const Client = require("./Client")(sequelize, Sequelize.DataTypes);
const OrderDraft = require("./OrderDraft")(sequelize, Sequelize.DataTypes);
const Notification = require("./Notification")(sequelize, Sequelize.DataTypes);
const ClubTests = require("./ClubTests")(sequelize, Sequelize.DataTypes);
const GstRecords = require("./GstRecords")(sequelize, Sequelize.DataTypes);

// Inventory.belongsTo(Employee, { foreignKey: "reviewed_by", as: "inventory" });

Leaves.belongsTo(Employee, {
  foreignKey: "emp_id",
  as: "employee",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Employee.hasMany(Leaves, {
  foreignKey: "emp_id",
  as: "leaves",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Tickets.belongsTo(Employee, {
  foreignKey: "emp_id",
  as: "creator",
});

// Association with Employee (closed by)
Tickets.belongsTo(Employee, {
  foreignKey: "closed_by",
  as: "closedBy",
});

const SampleMaterials = require("./SampleMaterials")(
  sequelize,
  Sequelize.DataTypes,
);
const Jobs = require("./Jobs")(sequelize, Sequelize.DataTypes);

const OrderLedger = require("./OrderLedger")(sequelize, Sequelize.DataTypes);

const SampleParams = require("./SampleParams")(sequelize, Sequelize.DataTypes);
const Customers = require("./Customers")(sequelize, Sequelize.DataTypes);

const MaterialTestingQuotation = require("./materialTestingQuotations")(
  sequelize,
  Sequelize.DataTypes,
);
const TaxedOrders = require("./TaxedOrders")(sequelize, Sequelize.DataTypes);

const Ledger = require("./Ledger")(sequelize, Sequelize.DataTypes);
const Vendor = require("./Vendor")(sequelize, Sequelize.DataTypes);
const VendorLedger = require("./VenderLedger")(sequelize, Sequelize.DataTypes);
// associations

//Feedback
Customers.hasMany(Feedback, {
  foreignKey: "customer_id",
  as: "feedbacks",
});
Feedback.belongsTo(Customers, {
  foreignKey: "customer_id",
  as: "customer",
});

Orders.hasOne(Feedback, {
  foreignKey: "order_id",
  as: "feedback",
});

Feedback.belongsTo(Orders, {
  foreignKey: "order_id",
  as: "order",
});

//logs
const Logs = require("./Logs")(sequelize, Sequelize.DataTypes);
LogsCategory.hasMany(Logs, {
  foreignKey: "lc_id",
  as: "logs",
});

Logs.belongsTo(LogsCategory, {
  foreignKey: "lc_id",
  as: "category",
});

Logs.belongsTo(Employee, {
  foreignKey: "logged_by",
  as: "employee",
});

Employee.hasMany(Logs, {
  foreignKey: "log_pk",
  as: "log",
});

TaxedOrders.hasMany(Orders, {
  foreignKey: "tax_number",
  as: "orders",
});

TaxedOrders.belongsTo(Employee, {
  foreignKey: "converted_by",
  as: "convertedByEmployee",
});

Orders.belongsTo(TaxedOrders, {
  foreignKey: "tax_number",
  as: "taxedOrder",
});
Employee.hasMany(TaxedOrders, {
  foreignKey: "converted_by",
  as: "convertedOrders",
});

//Employee
// Employee.hasMany(SampleParams, { foreignKey: "analyst", as: "employee" });

Employee.hasMany(Jobs, {
  foreignKey: "emp_id",
  as: "job",
});

Jobs.belongsTo(Employee, {
  foreignKey: "emp_id",
  as: "analyst",
});

Orders.hasMany(SampleMaterials, { foreignKey: "order_id", as: "samples" });
Customers.hasMany(Orders, {
  foreignKey: "customer_id",
  as: "orders", // This should match the alias used in your query
});

SampleMaterials.belongsTo(Orders, { foreignKey: "order_id", as: "order" });

Jobs.belongsTo(SampleMaterials, {
  foreignKey: "sample_id",
  as: "sampleDetails",
});

SampleMaterials.hasMany(Jobs, {
  foreignKey: "sample_id",
  as: "jobs",
});

Orders.belongsTo(Customers, {
  foreignKey: "customer_id",
  as: "customer",
});

SampleMaterials.hasMany(SampleParams, {
  foreignKey: "sample_id",
  as: "params",
});

Orders.hasMany(OrderLedger, {
  foreignKey: "order_id",
  as: "ledger",
});

SampleMaterials.belongsTo(Product, { foreignKey: "product_id", as: "product" });
Product.hasMany(SampleMaterials, { foreignKey: "product_id", as: "samples" });
Product.hasMany(Params, { foreignKey: "subgroup", as: "params" });
Params.hasMany(SampleParams, { foreignKey: "param_id", as: "sampleParams" });
Params.belongsTo(Product, { foreignKey: "subgroup", as: "product" });

Employee.belongsTo(Employee, {
  foreignKey: "reporting_manager",
  as: "reportingManager",
});

Employee.hasMany(Employee, {
  foreignKey: "reporting_manager",
  as: "reportees",
});

//sample params
SampleParams.belongsTo(SampleMaterials, {
  foreignKey: "sample_id",
  as: "sample",
});

// SampleParams.belongsTo(Employee, {
//   foreignKey: "analyst",
//   as: "employee",
// });

SampleParams.belongsTo(Params, {
  foreignKey: "param_id",
  as: "param",
});

Employee.belongsTo(Role, {
  foreignKey: "role",
  as: "roleDetails",
});

Employee.belongsTo(Department, {
  foreignKey: "department",
  as: "departmentDetails",
});

Role.hasMany(Employee, {
  foreignKey: "role",
  as: "employees",
});

Branch.hasMany(Employee, {
  foreignKey: "branch",
  as: "employeeDetails",
});

Employee.belongsTo(Branch, {
  foreignKey: "branch",
  as: "branchDetails",
});

Employee.hasMany(Tickets, {
  foreignKey: "emp_id",
  as: "ticket_creator",
});

// Employee.hasMany(Tickets, {
//   foreignKey: "emp_id",
//   as: "ticket_creator",
// });

// 🚀 Notification relationships
Employee.hasMany(Notification, {
  foreignKey: "receiver_emp_id",
  as: "notifications",
});

Notification.belongsTo(Employee, {
  foreignKey: "receiver_emp_id",
  as: "receiver",
});

Orders.hasMany(Notification, {
  foreignKey: "order_number",
  sourceKey: "order_number",
  as: "notifications",
});

Notification.belongsTo(Orders, {
  foreignKey: "order_number",
  targetKey: "order_number",
  as: "order",
});

GstRecords.belongsTo(Customers, {
  foreignKey: "customer_id",
  as: "customer",
});

Ledger.belongsTo(Customers, {
  foreignKey: "customer_id",
  as: "customer",
});

VendorLedger.belongsTo(Vendor, {
  foreignKey: "vendor_id",
  as: "vendor",
});

Vendor.hasMany(VendorLedger, {
  foreignKey: "vendor_id",
  as: "vendorLedger",
});

PurchaseOrder.hasMany(PoDocument, {
  foreignKey: "po_id",
  as: "documents",
  onDelete: "CASCADE",
});

PoDocument.belongsTo(PurchaseOrder, {
  foreignKey: "po_id",
  as: "purchaseOrder",
  onDelete: "CASCADE",
});

//     GstRecords.hasMany(Orders, {
//   foreignKey: "gst",
//   as: "gstin",
// });

Customers.hasMany(GstRecords, {
  foreignKey: "customer_id",
  as: "gst_records",
});

Customers.hasMany(Ledger, {
  foreignKey: "customer_id",
  as: "ledger",
});

db.User = User;
db.Cart = Cart;
db.Subscriber = Subscriber;
db.Callback = Callback;
db.Orders = Orders;
db.Product = Product;
db.Params = Params;
db.Employee = Employee;
db.Branch = Branch;
db.Department = Department;
db.Role = Role;
db.AccessKey = AccessKey;
db.SampleMaterials = SampleMaterials;
db.SampleParams = SampleParams;
db.Customers = Customers;
db.MaterialTestingQuotation = MaterialTestingQuotation;
db.Jobs = Jobs;
db.Tickets = Tickets;
db.Leaves = Leaves;
db.Inventory = Inventory;
db.Logs = Logs;
db.LogsCategory = LogsCategory;
db.SampleMaterialFields = SampleMaterialFields;
db.Client = Client;
db.OrderDraft = OrderDraft;
db.Notification = Notification;
db.ClubTests = ClubTests;
db.GstRecords = GstRecords;
db.NdtQuotation = NdtQuotation;
db.WorkOrder = WorkOrder;
db.WorkOrder = WorkOrder;
db.GtQuotation = GtQuotation;
db.OrderLedger = OrderLedger;
db.Ledger = Ledger;
db.Vendor = Vendor;
db.VendorLedger = VendorLedger;
db.Feedback = Feedback;
db.PurchaseOrder = PurchaseOrder;
db.PoDocument = PoDocument;
db.WoDocument = WoDocument;

module.exports = {
  User,
  db,
  sequelize,
  Sequelize,
  Cart,
  Subscriber,
  Callback,
  Product,
  Params,
  Employee,
  Branch,
  Department,
  Role,
  AccessKey,
  NdtQuotation,
  Orders,
  SampleMaterials,
  OrderLedger,
  SampleParams,
  Customers,
  MaterialTestingQuotation,
  Jobs,
  Leaves,
  TaxedOrders,
  Inventory,
  Logs,
  LogsCategory,
  SampleMaterialFields,
  Client,
  OrderDraft,
  Notification,
  ClubTests,
  GstRecords,
  PurchaseOrder,
  PoDocument,
  WoDocument,
  WorkOrder,
  GtQuotation,
  Ledger,
  Vendor,
  VendorLedger,
  Feedback,
};

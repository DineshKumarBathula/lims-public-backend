const cors = require("cors");
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(path.join(__dirname, "public")));
require("dotenv").config();
const DELAY = process.env.DELAY || 0;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization, data",
  );
  setTimeout(() => {
    next();
  }, DELAY);
});
const poDocumentRoutes = require("./routes/poDocuments");

app.use("/api", poDocumentRoutes);

const workOrderRoutes = require("./routes/workroutes");
const purchaseOrderRoutes = require("./routes/purchaseOrderRoutes");

const db = require("./models/index");
const ecommerceRoutes = require("./routes/ecommerceRoutes");
const bdRoutes = require("./routes/bdRoutes");
const hrRoutes = require("./routes/hrRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const trial = require("./routes/trial");
const admin = require("./routes/adminRoutes");
const reports = require("./routes/reportRoutes");
const laboratory = require("./routes/laboratory");
const analystRoutes = require("./routes/analystRoutes");
const hodRoutes = require("./routes/hodRoutes");
const customers = require("./routes/customerRoutes");
const orders = require("./routes/ordersRoutes");
const aws = require("./routes/aws");
const stats = require("./routes/stats");
const it = require("./routes/it");
const currentUser = require("./routes/currentUserRoutes");
const ledgerRouter = require("./routes/ledger.routes");
app.use("/api", require("./routes/woDocumentRoutes"));
app.use("/api/bd/purchase-orders", purchaseOrderRoutes);
app.use("/api/work-orders", workOrderRoutes);
app.use("/api/ecommerce", ecommerceRoutes);
app.use("/api/bd", bdRoutes);
app.use("/api/hr-admin", hrRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/admin", admin);
app.use("/api/reports", reports);
app.use("/api/lab", laboratory);
app.use("/api/analyst", analystRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/health", trial);
app.use("/api/customer", customers);
app.use("/api/auth", trial);
app.use("/api/order", orders);
app.use("/api/aws", aws);
app.use("/api/stats", stats);
app.use("/api/it", it);
app.use("/api/cu", currentUser);
app.use("/api/ledger", ledgerRouter);

db.sequelize.sync().then(() => {
  app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
  });
});

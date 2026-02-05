const express = require("express");
const ledgerRouter = express.Router();
const ledgerController = require("../controllers/ledger.controller");

// ✅ Add a new ledger entry (for an order)
ledgerRouter.post("/add", ledgerController.addLedgerEntry);
ledgerRouter.post("/add-vendor-ledger", ledgerController.addVendorLedgerEntry);
// ✅ Fetch all ledgers of a specific order
// ledgerRouter.get("/order-ledger/:order_id", ledgerController.getOrderLedger);
ledgerRouter.get(
  "/vendor-ledger/:vendor_id",
  ledgerController.getVendorsLedger,
);

// ✅ Fetch consolidated ledger of all customers
ledgerRouter.get(
  "/customer-ledger/:customer_id",
  ledgerController.getCustomerLedgerSummary,
);
ledgerRouter.get("/monthly-ledger", ledgerController.getMonthlyLedgerSummary);
ledgerRouter.get("/yearly-ledger", ledgerController.getYearlyLedgerSummary);
ledgerRouter.delete("/delete-ledger/:id", ledgerController.deleteLedgerById);
ledgerRouter.delete(
  "/delete-vendor-ledger/:id",
  ledgerController.deleteVendorLedgerById,
);

module.exports = ledgerRouter;

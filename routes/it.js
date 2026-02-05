const express = require("express");
const router = express.Router();

const {
  raiseTicket,
  fetchAllTickets,
} = require("../controllers/itControllers");
const { validateToken } = require("../defs/customFunctions");

router.post("/raise-ticket", validateToken, raiseTicket);
router.get("/get-all-tickets", validateToken, fetchAllTickets);

module.exports = router;

const { sequelize, db } = require("../models");
// const { Op, fn, col, literal } = require("sequelize");

const { Tickets, Employee } = db;

const raiseTicket = async (req, res) => {
  const { issue, subject, description, priority } = req.body;
  try {
    const newRec = {
      issue,
      subject,
      description,
      priority,
      emp_id: req.emp_id,
      status: 0,
    };
    const dbResponse = await Tickets.create(newRec, { raw: true });
    res.status(200).json({
      message: `Ticket is registered Successfully, IT Team will approcah you to discuss more about the issue. Thanks for your contribution in enhancing User experience `,
      data: dbResponse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: `Failed to Register ticket related to ${issue}, please try again or call +91 8179769162`,
    });
  }
};

const getAllTicketsOfEmpId = async (emp_id) => {
  try {
    const tickets = await Tickets.findAll({
      where: {
        emp_id: emp_id,
      },
      order: [["created_at", "DESC"]],
    });
    return tickets;
  } catch (error) {
    throw error;
  }
};

const fetchAllTickets = async (req, res) => {
  console.log("This si triggered");
  try {
    const dbResponse = await Tickets.findAll({
      include: [
        {
          model: Employee,
          as: "creator",
          attributes: ["emp_id", "first_name", "last_name", "profile_photo"],
        },
      ],
    });

    return res.status(200).json({ data: dbResponse });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: `Failed to fetch tickets`,
    });
  }
};

module.exports = {
  raiseTicket,
  getAllTicketsOfEmpId,
  fetchAllTickets,
};

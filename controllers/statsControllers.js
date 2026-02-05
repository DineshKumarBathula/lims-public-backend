const { Orders, Customers, Sequelize, sequelize } = require("../models/index");
const { Op } = require("sequelize");

//returns frequent customers
const getMoreOrdersPlacedCustomersStats = async (req, res) => {
  try {
    const customersWithOrderCounts = await Customers.findAll({
      attributes: [
        "customer_id",
        "reporting_name",
        [
          Sequelize.fn("COUNT", Sequelize.col("orders.order_id")),
          "order_count",
        ],
      ],
      include: [
        {
          model: Orders,
          as: "orders",
          attributes: [],
        },
      ],
      group: ["Customer.customer_id"],
      order: [[Sequelize.literal("order_count"), "DESC"]],
      subQuery: false,
      raw: true,
      limit: 25,
    });

    const formattedData = customersWithOrderCounts.map((customer) => ({
      id: customer.customer_id,
      name: customer.reporting_name,
      count: customer.order_count,
    }));

    return res.status(200).json({
      data: formattedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

//returns which customer is placing high amount orders
const getCostlyCustomers = async (req, res) => {
  try {
    const costlyCustomers = await Orders.findAll({
      attributes: [
        "customer_id",
        [sequelize.literal("SUM(amount)"), "total_spent"],
      ],
      include: [
        {
          model: Customers,
          as: "customer",
          attributes: ["reporting_name"],
        },
      ],
      group: ["customer_id"],
      order: [[sequelize.literal("total_spent"), "DESC"]],
      limit: 25,
      raw: true,
    });
    const result = costlyCustomers.map((order) => ({
      // id: order.customer_id,
      id: order.customer_id,
      name: order["customer.reporting_name"],
      count: parseInt(order.total_spent),
    }));

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// const getMonthlywiseStats = async () => {
//   try {
//     // Query to get monthly statistics
//     const stats = await Orders.findAll({
//       attributes: [
//         [Sequelize.fn("DATE_FORMAT", Sequelize.col("dor"), "%m-%Y"), "dor"],
//         [Sequelize.fn("SUM", Sequelize.col("amount")), "amount"],
//         [
//           Sequelize.fn("SUM", Sequelize.col("transportation_fee")),
//           "transportation",
//         ],
//         [Sequelize.fn("COUNT", Sequelize.col("order_id")), "total_orders"],
//       ],
//       where: {
//         dor: {
//           [Sequelize.Op.gte]: new Date("2023-12-31T18:30:00Z"),
//           [Sequelize.Op.lt]: new Date("2024-12-31T18:30:00Z"),
//         },
//       },
//       group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("dor"), "%m-%Y")],
//       order: [
//         [Sequelize.fn("DATE_FORMAT", Sequelize.col("dor"), "%m-%Y"), "ASC"],
//       ],
//     });

//     // Initialize an object to hold the monthly stats
//     const transformedStats = stats.map((item) => {
//       return {
//         id: item.dor,
//         amount: parseFloat(item.amount),
//         transportation: parseFloat(item.transportation),
//         [item.dor]: [], // Initialize an empty array for daily orders
//       };
//     });

//     // Create an object to store daily order counts
//     const dailyOrderCounts = {};

//     // Loop through each month to calculate daily order counts
//     for (let stat of transformedStats) {
//       const monthYear = stat.id; // e.g., "01-2024"
//       const [month, year] = monthYear.split("-").map(Number); // Extract month and year

//       // Calculate the number of days in the month
//       const daysInMonth = new Date(year, month, 0).getDate();

//       // Initialize daily counts array
//       const dailyCounts = new Array(daysInMonth).fill(0);

//       // Fetch daily order counts for the specific month and year
//       const dailyStats = await Orders.findAll({
//         attributes: [
//           [Sequelize.fn("DAY", Sequelize.col("dor")), "day"],
//           [Sequelize.fn("COUNT", Sequelize.col("order_id")), "total_orders"],
//         ],
//         where: Sequelize.and(
//           Sequelize.where(Sequelize.fn("MONTH", Sequelize.col("dor")), month),
//           Sequelize.where(Sequelize.fn("YEAR", Sequelize.col("dor")), year)
//         ),
//         group: [Sequelize.fn("DAY", Sequelize.col("dor"))],
//       });

//       // Populate daily counts based on the fetched daily stats
//       dailyStats.forEach((dayStat) => {
//         const day = dayStat.day - 1; // Convert to zero-based index
//         dailyCounts[day] = parseInt(dayStat.total_orders, 10); // Update total orders for the day
//       });

//       // Assign the daily counts array to the corresponding month
//       stat[monthYear] = dailyCounts;
//     }

//     return transformedStats; // Return the final report
//   } catch (err) {
//     throw err;
//   }
// };

const getMonthlywiseStats = async () => {
  const monthlyReport = await Orders.findAll({
    attributes: [
      [sequelize.fn("DATE_FORMAT", sequelize.col("dor"), "%Y-%m"), "month"], // Group by month and year
      [sequelize.fn("COUNT", sequelize.col("order_id")), "total_orders"], // Count of orders
      [sequelize.fn("SUM", sequelize.col("amount")), "total_amount"], // Total amount
      [
        sequelize.fn("SUM", sequelize.col("transportation_fee")),
        "total_transportation_fees",
      ], // Total transportation fees
    ],
    group: [sequelize.fn("DATE_FORMAT", sequelize.col("dor"), "%Y-%m")], // Group by month
    order: [
      [sequelize.fn("DATE_FORMAT", sequelize.col("dor"), "%Y-%m"), "DESC"],
    ], // Order by month (ascending)
    raw: true,
  });

  // Day-wise count query
  const dayWiseOrders = await Orders.findAll({
    attributes: [
      [sequelize.fn("DATE_FORMAT", sequelize.col("dor"), "%Y-%m-%d"), "day"], // Get day in the format YYYY-MM-DD
      [sequelize.fn("COUNT", sequelize.col("order_id")), "day_order_count"], // Count orders per day
    ],
    group: [sequelize.fn("DATE_FORMAT", sequelize.col("dor"), "%Y-%m-%d")], // Group by day
    raw: true,
  });

  // Helper function to get the number of days in a month
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

  // Map the monthly report and add day-wise order count for each month
  const result = monthlyReport.map((report) => {
    const yearMonth = report.month; // Format: YYYY-MM
    const [year, month] = yearMonth.split("-");
    const totalDaysInMonth = getDaysInMonth(parseInt(year), parseInt(month));

    // Initialize day-wise order count array with 0 for each day
    const dayWiseCount = new Array(totalDaysInMonth).fill(0);

    // Populate the day-wise order count from the dayWiseOrders data
    dayWiseOrders.forEach((order) => {
      if (order.day.startsWith(yearMonth)) {
        const dayIndex = parseInt(order.day.split("-")[2]) - 1; // Get the day (1-31) and subtract 1 for 0-indexed array
        dayWiseCount[dayIndex] = parseInt(order.day_order_count);
      }
    });

    return {
      month: report.month, // The year-month string
      total_orders: parseInt(report.total_orders), // Total orders placed in that month
      total_amount: parseFloat(report.total_amount), // Total amount generated in that month
      total_transportation_fees: parseFloat(report.total_transportation_fees), // Total transportation fees generated in that month
      [report.month]: dayWiseCount, // Array containing day-wise order counts
    };
  });

  return result;
};

const getAllmonthsReport = async (req, res) => {
  try {
    const report = await getMonthlywiseStats();
    return res.status(200).json({
      data: report,
    });
  } catch (err) {
    console.log("error fetching All month reports");
    console.log(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getMoreOrdersPlacedCustomersStats,
  getCostlyCustomers,
  getAllmonthsReport,
};

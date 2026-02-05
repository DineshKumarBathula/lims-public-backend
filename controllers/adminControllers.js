const {
  sequelize,
  Orders,
  Subscriber,
  Callback,
  User,
  Customers,
} = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const moment = require("moment");

const getDailyCounts = async (req, res) => {
  try {
    const endDate = moment().endOf("day");
    const startDate = moment().subtract(29, "days").startOf("day");

    const dateRange = [];
    for (
      let m = moment(startDate);
      m.isSameOrBefore(endDate);
      m.add(1, "days")
    ) {
      dateRange.push(m.format("YYYY-MM-DD"));
    }

    const getDailyCountsFromTable = async (model, dateColumn) => {
      const counts = await model.findAll({
        attributes: [
          [fn("DATE", col(dateColumn)), "day"],
          [fn("COUNT", "*"), "count"],
        ],
        where: {
          [dateColumn]: {
            [Op.between]: [startDate.toDate(), endDate.toDate()],
          },
        },
        group: [fn("DATE", col(dateColumn))],
        raw: true,
      });

      const countsMap = {};
      counts.forEach((count) => {
        countsMap[count.day] = count.count;
      });

      return countsMap;
    };

    const ordersCounts = await getDailyCountsFromTable(Orders, "created_at");
    const subscribersCounts = await getDailyCountsFromTable(
      Subscriber,
      "subscribed_at",
    );
    const callBacksCounts = await getDailyCountsFromTable(
      Callback,
      "requested_at",
    );
    const usersCounts = await getDailyCountsFromTable(User, "registeredDate");
    const customersCounts = await getDailyCountsFromTable(
      Customers,
      "created_at",
    );

    const result = dateRange.map((date) => ({
      label: date,
      orders: ordersCounts[date] || 0,
      subscribers: subscribersCounts[date] || 0,
      callBacks: callBacksCounts[date] || 0,
      users: usersCounts[date] || 0,
      customers: customersCounts[date] || 0,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getMonthlyCounts = async (req, res) => {
  try {
    const endDate = moment().endOf("month");
    const startDate = moment().subtract(11, "months").startOf("month");

    const dateRange = [];
    for (
      let m = moment(startDate);
      m.isSameOrBefore(endDate);
      m.add(1, "months")
    ) {
      dateRange.push(m.format("YYYY-MM"));
    }

    const getMonthlyCountsFromTable = async (model, dateColumn) => {
      const counts = await model.findAll({
        attributes: [
          [fn("DATE_FORMAT", col(dateColumn), "%Y-%m"), "month"],
          [fn("COUNT", "*"), "count"],
        ],
        where: {
          [dateColumn]: {
            [Op.between]: [startDate.toDate(), endDate.toDate()],
          },
        },
        group: [fn("DATE_FORMAT", col(dateColumn), "%Y-%m")],
        raw: true,
      });

      const countsMap = {};
      counts.forEach((count) => {
        countsMap[count.month] = count.count;
      });

      return countsMap;
    };

    const ordersCounts = await getMonthlyCountsFromTable(Orders, "created_at");
    const subscribersCounts = await getMonthlyCountsFromTable(
      Subscriber,
      "subscribed_at",
    );
    const callBacksCounts = await getMonthlyCountsFromTable(
      Callback,
      "requested_at",
    );
    const usersCounts = await getMonthlyCountsFromTable(User, "registeredDate");
    const customersCounts = await getMonthlyCountsFromTable(
      Customers,
      "created_at",
    );

    const result = dateRange.map((month) => ({
      label: month,
      orders: ordersCounts[month] || 0,
      subscribers: subscribersCounts[month] || 0,
      callBacks: callBacksCounts[month] || 0,
      users: usersCounts[month] || 0,
      customers: customersCounts[month] || 0,
    }));

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTop10AccountsOrdered = async (req, res) => {
  try {
    const query = `
      SELECT 
        users.email AS name,
        COUNT(orders.order_id) AS count
      FROM orders
      JOIN users ON orders.added_by = users.email
      GROUP BY users.email, users.email
      ORDER BY count DESC
      LIMIT 10;
    `;

    const topUsers = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.status(200).json({ data: topUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getTop10AccountsOrdered,
  getDailyCounts,
  getMonthlyCounts,
};

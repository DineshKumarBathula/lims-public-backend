const { Orders, OrderLedger, Customers } = require("../../models/index");
const { where } = require("../../models/Logs");

exports.createLedgerEntry = async (data) => {
  try {
    const ledgerEntry = await OrderLedger.create(data);
    return ledgerEntry;
  } catch (err) {
    throw err;
  }
};

exports.fetchLedgerByOrder = async (order_id) => {
  try {
    const ledgers = await OrderLedger.findAll({
      where: { order_id },
      order: [["received_date", "ASC"]],
    });
    return ledgers;
  } catch (err) {
    throw err;
  }
};

// Fetch ledger summary for all customers
// exports.fetchCustomerLedgerSummary = async (customer_id) => {
//   try {
//     const customers = await Customers.findAll({
//       where: {
//         customer_id: customer_id,
//       },
//       include: [
//         {
//           model: Orders,
//           as: "orders",
//           include: [
//             {
//               model: OrderLedger,
//               as: "ledger",
//             },
//           ],
//           order: [["created_at", "DESC"]],
//         },
//       ],
//     });

//     return customers[0].orders || [];
//   } catch (err) {
//     throw err;
//   }
// };

exports.fetchCustomerLedgerSummary = async (customer_id) => {
  try {
    const customer = await Customers.findOne({
      where: { customer_id },
      include: [
        {
          model: Orders,
          as: "orders",
          include: [
            {
              model: OrderLedger,
              as: "ledger",
              separate: true, // ✅ ensures ledger records are fetched per order
              order: [["created_at", "ASC"]],
            },
          ],
          order: [["created_at", "DESC"]],
        },
      ],
    });

    return customer ? customer.orders : [];
  } catch (err) {
    throw err;
  }
};

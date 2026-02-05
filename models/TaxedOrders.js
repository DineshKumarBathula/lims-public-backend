// module.exports = (sequelize, DataTypes) => {
//   const TaxedOrders = sequelize.define(
//     "TaxedOrders",
//     {
//       tax_number: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         allowNull: false,
//       },
//       date: {
//         type: DataTypes.DATE,
//         allowNull: false,
//       },
//       converted_by: {
//         type: DataTypes.STRING(20),
//         allowNull: true,
//         references: {
//           model: "employee", // Matches the table name for the Employee model
//           key: "emp_id",
//         },
//       },
//       proforma_numbers: {
//         type: DataTypes.JSON,
//         allowNull: true,
//       },
//       file: {
//         type: DataTypes.STRING(30),
//         allowNull: false,
//       },
//     },
//     {
//       timestamps: false, // No createdAt or updatedAt columns
//       tableName: "taxed_orders", // Explicit table name
//     },
//   );

//   TaxedOrders.associate = (models) => {
//     // Association with Employee model
//     TaxedOrders.belongsTo(models.Employee, {
//       foreignKey: "converted_by",
//       as: "convertedByEmployee",
//     });

//     // Association with Orders model
//     TaxedOrders.hasMany(models.Orders, {
//       foreignKey: "tax_number",
//       as: "orders",
//     });
//   };

//   return TaxedOrders;
// };







module.exports = (sequelize, DataTypes) => {
  const TaxedOrders = sequelize.define(
    "TaxedOrders",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,          // ✅ REAL primary key
      },

      tax_number: {
        type: DataTypes.INTEGER,
        allowNull: false,          // ✅ duplicates allowed
      },

      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      converted_by: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      proforma_numbers: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      file: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: "taxed_orders",
    }
  );

  return TaxedOrders;
};

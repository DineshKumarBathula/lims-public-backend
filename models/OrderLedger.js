"use strict";

module.exports = (sequelize, DataTypes) => {
  const OrderLedger = sequelize.define(
    "OrderLedger",
    {
      ledger_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "order_id",
        },
      },
      received_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      received_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      mode_of_payment: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      remaining_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
    },
    {
      tableName: "order_ledger",
      timestamps: false,
    }
  );

  //  Associations
  OrderLedger.associate = (models) => {
    // Each ledger entry belongs to one order
    OrderLedger.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });
  };

  return OrderLedger;
};

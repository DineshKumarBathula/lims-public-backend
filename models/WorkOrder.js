"use strict";

module.exports = (sequelize, DataTypes) => {
  const WorkOrder = sequelize.define(
    "WorkOrder",
    {
      wo_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      ref_no: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      contracter_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      client_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      gst: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      kind_attention: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      preamble: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      payment_terms: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      conditions: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      vendor_id: {
        type: DataTypes.UUID, // or CHAR(36)
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      tableName: "workorder",
    },
  );

  // Associations placeholder (if needed in the future)
  WorkOrder.associate = (models) => {
    WorkOrder.hasMany(models.WoDocument, {
      foreignKey: "wo_id",
      as: "documents",
      onDelete: "CASCADE",
    });
  };

  return WorkOrder;
};

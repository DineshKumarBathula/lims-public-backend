"use strict";

module.exports = (sequelize, DataTypes) => {
  const WoDocument = sequelize.define(
    "WoDocument",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      wo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      invoice_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      doc_type: {
        type: DataTypes.ENUM("PI", "TI", "ACK"),
        allowNull: false,
      },

      doc_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      file_urls: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "wo_documents",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );

  WoDocument.associate = (models) => {
    WoDocument.belongsTo(models.WorkOrder, {
      foreignKey: "wo_id",
      as: "workOrder",
      onDelete: "CASCADE",
    });
  };

  return WoDocument;
};

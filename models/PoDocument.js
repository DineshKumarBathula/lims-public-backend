"use strict";

module.exports = (sequelize, DataTypes) => {
  const PoDocument = sequelize.define(
    "PoDocument",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      po_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },

      doc_type: {
        type: DataTypes.ENUM("PI", "TI", "ACK","TR"),
        allowNull: false,
      },

            invoice_no: {
        type: DataTypes.STRING(100), // ✅ VARCHAR
        allowNull: true,             // set false if mandatory
      },

      doc_date: {
        type: DataTypes.DATEONLY, // ✅ user selected date
        allowNull: false,
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },

      file_urls: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },

            tr_data: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE, // ✅ system timestamp
      },
    },
    {
      tableName: "po_documents",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  PoDocument.associate = (models) => {
    PoDocument.belongsTo(models.PurchaseOrder, {
      foreignKey: "po_id",
      as: "purchaseOrder",
      onDelete: "CASCADE",
    });
  };

  return PoDocument;
};

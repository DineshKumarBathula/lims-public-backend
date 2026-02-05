"use strict";

module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
      po_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      po_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      project_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      department: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      tax_paid_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      vendor_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      employee_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendor_address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      billing_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      shipping_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      contact: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gst: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quotation_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      terms: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      attachment_urls: {
        type: DataTypes.JSON, // ✅ multiple URLs
        allowNull: true,
        defaultValue: [],
      },

      warranty: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      delivery_period: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payment_terms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tax_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      extra_rows: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      tableName: "purchaseorder",
    },
  );

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.hasMany(models.PoDocument, {
      foreignKey: "po_id",
      as: "documents",
      onDelete: "CASCADE",
    });
  };

  return PurchaseOrder;
};

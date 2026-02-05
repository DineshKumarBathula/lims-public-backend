// models/NdtQuotation.js
module.exports = (sequelize, DataTypes) => {
  const NdtQuotation = sequelize.define(
    "NdtQuotation",
    {
      qtn_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      screen_data: {
        type: DataTypes.JSON,
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

      created_by: {
        type: DataTypes.STRING,
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

      subtotal: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      gst: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },

      total: {
        type: DataTypes.FLOAT,
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
    },
    {
      tableName: "ndt_quotations",
      timestamps: false,
    }
  );

  return NdtQuotation;
};

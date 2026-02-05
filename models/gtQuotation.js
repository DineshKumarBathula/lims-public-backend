// models/gtQuotation.js
module.exports = (sequelize, DataTypes) => {
  const GtQuotation = sequelize.define(
    "GtQuotation",
    {
      qtn_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      location: DataTypes.STRING,
      created_by: DataTypes.STRING,
      contact: DataTypes.STRING,
      email: DataTypes.STRING,
      subtotal: DataTypes.DECIMAL(12, 2),
      gst: DataTypes.DECIMAL(12, 2),
      total: DataTypes.DECIMAL(12, 2),
      discount: DataTypes.DECIMAL(12, 2),
      transportation_fee: DataTypes.DECIMAL(12, 2),
      payment_terms: DataTypes.JSON,
      conditions: DataTypes.JSON,
      screen_data: DataTypes.JSON,
      prefix_no: DataTypes.STRING, // e.g. GTQuote-1
    },
    {
      tableName: "gt_quotations",
      timestamps: true,
      underscored: true,
    }
  );

  return GtQuotation;
};

module.exports = (sequelize, DataTypes) => {
  const MaterialTestingQuotation = sequelize.define(
    "MaterialTestingQuotation",
    {
      qtn_id: {
        type: DataTypes.STRING(50),
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

      total_amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      discount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      transportation_fee: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "quotations",
      timestamps: false,
    }
  );

  return MaterialTestingQuotation;
};

"use strict";

module.exports = (sequelize, DataTypes) => {
  const LogsCategory = sequelize.define(
    "LogsCategory",
    {
      lc_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      lc_code: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      lc_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "logs_category",
      timestamps: true,
    },
  );

  // Associations
  LogsCategory.associate = (models) => {
    LogsCategory.hasMany(models.Logs, {
      foreignKey: "lc_id",
      as: "logs",
    });
  };

  return LogsCategory;
};

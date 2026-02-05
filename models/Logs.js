"use strict";

/** @type {import('sequelize').Model} */
module.exports = (sequelize, DataTypes) => {
  const Logs = sequelize.define(
    "Logs",
    {
      log_pk: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      lc_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "logs_category",
          key: "lc_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      logged_by: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: {
          model: "employee",
          key: "emp_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "logs", // Make sure it matches the table name in your database
      timestamps: false, // Since you're using a custom `created_at` field
    },
  );

  // Associations
  Logs.associate = (models) => {
    // Logs belongs to logs_category
    Logs.belongsTo(models.LogsCategory, {
      foreignKey: "lc_id",
      as: "category",
    });

    // Logs belongs to employee (for logged_by)
    Logs.belongsTo(models.Employee, {
      foreignKey: "logged_by",
      as: "employee",
    });
  };

  return Logs;
};

"use strict";

module.exports = (sequelize, DataTypes) => {
  const Tickets = sequelize.define(
    "Tickets",
    {
      ticket_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      emp_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
          model: "Employee", // Assumes "Employee" is the model name for employee table
          key: "emp_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      issue: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closed_by: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: {
          model: "Employee",
          key: "emp_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
    },
    {
      timestamps: false, // As we are using custom timestamps
      tableName: "tickets",
    },
  );

  Tickets.associate = (models) => {
    Tickets.belongsTo(models.Employee, {
      foreignKey: "emp_id",
      as: "creator",
    });

    // Association with Employee (closed by)
    Tickets.belongsTo(models.Employee, {
      foreignKey: "closed_by",
      as: "closedBy",
    });
  };

  return Tickets;
};

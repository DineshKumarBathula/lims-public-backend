"use strict";

module.exports = (sequelize, DataTypes) => {
  const Jobs = sequelize.define(
    "Jobs",
    {
      job_pk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      sample_id: {
        type: DataTypes.STRING,
        references: {
          model: "SampleMaterials",
          key: "sample_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      emp_id: {
        type: DataTypes.STRING,
        references: {
          model: "Employee",
          key: "emp_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      report: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      reportLocation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      analyst_sign: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      manager_sign: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bd_sign: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      doa: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dos: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        //0 = not yet assigned
        //1 = assigned but not submited
        //2 = submited pending for review
        //3 = rejected
        //10 = accepted and dispatched
      },
      job_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      discipline: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nabl: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      params_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      jdata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      job_dispatched_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      order_id: {
        type: DataTypes.STRING,
        references: {
          model: "Orders",
          key: "order_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      report_dispatched_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dispatch_job: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      report_approval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      start_date: {
        type: DataTypes.STRING,
        default: null,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.STRING,
        default: null,
        allowNull: true,
      },
      ulrData: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reportIssueDate: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },

      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      tableName: "jobs",
    },
  );

  Jobs.associate = (models) => {
    // Association with SampleMaterials
    Jobs.belongsTo(models.SampleMaterials, {
      foreignKey: "sample_id",
      as: "sampleDetails",
    });
    Jobs.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });
    // Association with Employee
    Jobs.belongsTo(models.Employee, {
      foreignKey: "emp_id",
      as: "analyst",
    });
  };

  return Jobs;
};

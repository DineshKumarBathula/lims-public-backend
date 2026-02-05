module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "Employee",
    {
      emp_id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      first_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      profile_photo: {
        type: DataTypes.STRING(400),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isPhoneNumber: function (value) {
            if (!/^\d{10}$/.test(value)) {
              throw new Error("Phone number must be 10 digits");
            }
          },
        },
      },
      department: {
        type: DataTypes.STRING(50),
        allowNull: true,
        references: {
          model: "department",
          key: "dept_id",
        },
      },
      role: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "role",
          key: "role_id",
        },
      },
      branch: {
        type: DataTypes.STRING(50),
        allowNull: true,
        references: {
          model: "branches",
          key: "branch_id",
        },
      },
      reporting_manager: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: {
          model: "employee",
          key: "emp_id",
        },
      },
      access_key: {
        type: DataTypes.STRING(100),
        allowNull: true,
        references: {
          model: "access_keys",
          key: "access_id",
        },
      },
      available_leaves: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
      },
      hashed_password: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "employee",
    }
  );

  Employee.associate = (models) => {
    Employee.hasMany(models.Notification, {
      foreignKey: "receiver_emp_id",
      as: "notifications",
    });

    // Employee.hasMany(models.inventory, {
    //   foreignKey: "reviewed_by",
    //   as: "empReviewed",
    // });

    Employee.hasMany(models.Jobs, {
      foreignKey: "emp_id",
      as: "job",
    });

    Employee.hasMany(models.Logs, {
      foreignKey: "log_id",
      as: "log",
    });

    Employee.hasMany(models.Leaves, {
      foreignKey: "emp_id",
      as: "leaves",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
    Employee.belongsTo(models.Employee, {
      foreignKey: "reporting_manager",
      as: "reportingManager",
    });
    Employee.hasMany(models.Employee, {
      foreignKey: "reporting_manager",
      as: "reportees",
    });
    Employee.belongsTo(models.Role, {
      foreignKey: "role",
      as: "roleDetails",
    });
    Employee.belongsTo(models.Department, {
      foreignKey: "department",
      as: "departmentDetails",
    });
    Employee.belongsTo(models.Branch, {
      foreignKey: "branch",
      as: "branchDetails",
    });
    Employee.hasMany(models.Tickets, {
      foreignKey: "emp_id",
      as: "ticket_creator",
    });
    Employee.hasMany(models.TaxedOrders, {
      foreignKey: "converted_by",
      as: "convertedOrders", // Alias for the association
    });
    // Employee.hasMany(models.Inventory, {
    //   foreignKey: "reviewed_by",
    //   as: "reviewedInventories",
    // });
  };

  return Employee;
};

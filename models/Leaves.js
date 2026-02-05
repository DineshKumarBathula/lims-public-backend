module.exports = (sequelize, DataTypes) => {
  const Leaves = sequelize.define(
    "Leaves",
    {
      leave_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      emp_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "employee",
          key: "emp_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      leave_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "casual",
      },
      remark: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      days_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "leaves",
      timestamps: false,
    },
  );

  Leaves.associate = (models) => {
    Leaves.belongsTo(models.Employee, {
      foreignKey: "emp_id",
      as: "employee", // Alias for easy access to the employee associated with a leave
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  };

  return Leaves;
};

module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    "Department",
    {
      dept_id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
      },
      department: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      additional_info: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "department",
    },
  );

  return Department;
};

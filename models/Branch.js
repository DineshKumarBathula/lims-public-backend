module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    "Branch",
    {
      branch_id: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false,
      },
      branch: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "branches",
    }
  );

  Branch.associate = (models) => {
    Branch.hasMany(models.Employee, {
      foreignKey: "branch",
      as: "employeeDetails",
    });
  };

  return Branch;
};

// const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "user",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true,
        validate: {
          isEmail: true,
        },
      },
      mobile: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          is: /^\d{10}$/,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      registeredDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
    },
  );

  return User;
};

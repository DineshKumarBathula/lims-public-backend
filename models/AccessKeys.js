module.exports = (sequelize, DataTypes) => {
  const AccessKey = sequelize.define(
    "AccessKey",
    {
      access_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      added_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "access_keys", // Define the table name explicitly
      timestamps: false,
    },
  );

  return AccessKey;
};

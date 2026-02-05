module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notification_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      receiver_emp_id: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
       order_number: {
        type: DataTypes.BIGINT,
        allowNull: true,
        unique: true,
      },
      acknowledge: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "notification",
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.Employee, {
      foreignKey: "receiver_emp_id",
      as: "receiver",
    });

    Notification.belongsTo(models.Orders, {
      foreignKey: "order_number",
      targetKey: "order_number",
      as: "order",
    });
  };

  return Notification;
};

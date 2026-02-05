module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define(
    "Feedback",
    {
      fId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      customer_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: "customers",
          key: "customer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      order_id: {
        type: DataTypes.CHAR(36), // ✅ FIXED (important)
        allowNull: false,
        references: {
          model: "orders",
          key: "order_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      feedback: {
        type: DataTypes.JSON,
        get() {
          const raw = this.getDataValue("feedback");
          return typeof raw === "string" ? JSON.parse(raw) : raw;
        },
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "feedback",
      timestamps: false,
    },
  );

  Feedback.associate = (models) => {
    Feedback.belongsTo(models.Customer, {
      foreignKey: "customer_id",
      as: "customer",
    });

    Feedback.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });
  };

  return Feedback;
};

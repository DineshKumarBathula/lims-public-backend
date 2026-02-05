module.exports = (sequelize, DataTypes) => {
  const OrderDraft = sequelize.define(
    "OrderDraft",
    {
      order_number: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      sample_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      dor: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("draft", "finalized"),
        allowNull: false,
        defaultValue: "draft",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      checklist: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
    },
    {
      tableName: "order_drafts",
      timestamps: false, // disable createdAt/updatedAt auto-generation
    },
  );

  return OrderDraft;
};

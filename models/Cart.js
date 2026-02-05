module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define(
    "cart",
    {
      cart_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      sample_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },

      param_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: "params",
          key: "param_id",
        },
      },

      added_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      added_by: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "users",
          key: "email",
        },
      },
    },

    {
      timestamps: false,
      tableName: "cart",
    },
  );
  return Cart;
};

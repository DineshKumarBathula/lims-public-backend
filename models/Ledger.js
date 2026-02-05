module.exports = (sequelize, DataTypes) => {
  const Ledger = sequelize.define(
    'Ledger',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      customer_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },

      ledger_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      entries: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      // ✅ Newly added columns
      order_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      tax_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      tax_converted_date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'ledger',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Ledger.associate = (models) => {
    Ledger.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer',
    });
  };

  return Ledger;
};

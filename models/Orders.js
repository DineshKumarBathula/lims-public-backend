module.exports = (sequelize, DataTypes) => {
  const Orders = sequelize.define(
    "Orders",
    {
      order_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      tax_file: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      dor: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      transportation_fee: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      proforma: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      reporting_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ref: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      gst: {
        type: DataTypes.CHAR(36), // ✅ Added gst column
        allowNull: true,
      },

      customer_id: {
        type: DataTypes.CHAR(36),
        allowNull: true,
        references: {
          model: "customers",
          key: "customer_id",
        },
      },
      project_name: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      letter: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order_number: {
        type: DataTypes.BIGINT,
        allowNull: true,
        unique: true,
      },

      order_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      // ✅ New field: division
      division: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      branch: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      pn: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // unique: true,
      },
      converted_to_tax: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tax_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "taxed_orders",
          key: "tax_number",
        },
      },
      sample_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
      },
      client_id: {
        type: DataTypes.CHAR(36),
        allowNull: true,
      },
      cancel: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = not canceled
        defaultValue: null, // 2 = canceled
      },
    },
    {
      timestamps: false,
      tableName: "orders",
    }
  );

  // ✅ Single associate block
  Orders.associate = (models) => {
    Orders.hasOne(models.Feedback, {
      foreignKey: "order_id",
      as: "feedback",
    });

    Orders.hasMany(models.Notification, {
      foreignKey: "order_number",
      sourceKey: "order_number",
      as: "notifications",
    });

    Orders.hasMany(models.SampleMaterials, {
      foreignKey: "order_id",
      as: "samples",
    });

    Orders.belongsTo(models.Customer, {
      foreignKey: "customer_id",
      as: "customer", // ⚠️ this alias must match in your include
    });

    Orders.belongsTo(models.TaxedOrders, {
      foreignKey: "tax_number",
      as: "taxedOrder",
    });

    // Orders.belongsTo(models.Client, {
    //   foreignKey: "client_id",
    //   as: "client",
    // });
  };

  return Orders;
};

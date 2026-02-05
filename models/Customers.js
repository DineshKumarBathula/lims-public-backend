module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    "Customer",
    {
      customer_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      reporting_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      reporting_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      billing_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      billing_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      mobile: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      pan: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      gst: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      discount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },
      project_info: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      // ✅ New fields
      additional_contacts: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      additional_emails: {
        type: DataTypes.JSON,
        allowNull: true,
      },


    },
    {
      timestamps: false,
      tableName: "customers",
    },
  );

  Customer.associate = (models) => {

    Customer.hasMany(models.Feedback, {
      foreignKey: "customer_id",
      as: "feedbacks",
    });


    Customer.hasMany(models.Orders, {
      foreignKey: "customer_id",
      as: "orders",
    });
    Customer.hasMany(models.Client, {
      foreignKey: "customer_id",
      as: "client",
    });
    Customer.hasMany(models.GstRecords, {
      foreignKey: "customer_id",
      as: "gst_records",
    });
    Customer.hasMany(models.Ledger, {
      foreignKey: "customer_id",
      as: "ledger",
    });
  };

  return Customer;
};

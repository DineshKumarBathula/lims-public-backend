module.exports = (sequelize, DataTypes) => {
  const GstRecords = sequelize.define(
    "GstRecords",
    {
      gst: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "customers",
          key: "customer_id",
          // onDelete: "CASCADE",
        },
      },


      bill_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

            pan_id: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      tableName: "gst_records",
    },
  );

  GstRecords.associate = (models) => {
    GstRecords.belongsTo(models.Customer, {
      foreignKey: "customer_id",
      as: "customer",
    });
  };

  // GstRecords.associate = (models) => {
  //   GstRecords.hasMany(models.Orders, {
  //     foreignKey: "gst",
  //     as: "gstin",
  //   });
  // };

  return GstRecords;
};

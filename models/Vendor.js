module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    "Vendor",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      vendor_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_person: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      },
      gst: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_bkg: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendor_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "vendors",
    }
  );

  Vendor.associate = (models) => {
        Vendor.hasMany(models.VendorLedger, {
      foreignKey: "vendor_id",
      as: "vendorLedger",
    });
  }

  return Vendor;
};

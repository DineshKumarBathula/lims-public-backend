module.exports = (sequelize, DataTypes) => {
  const VendorLedger = sequelize.define(
    "VendorLedger",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      vendor_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      po_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      bill_data: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      invoice_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      paid_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },

      mode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ref_id: {
        type: DataTypes.STRING, // or INTEGER if your DB column is INT
        allowNull: false,
      },
      ref_type: {
        type: DataTypes.ENUM("PO", "WO"),
        allowNull: false,
      },

      doc_type: {
        type: DataTypes.STRING, // 'PI' | 'TI' | 'ACK'
        allowNull: true,
      },

      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "vendors_ledger",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  VendorLedger.associate = (models) => {
    VendorLedger.belongsTo(models.Vendor, {
      foreignKey: "vendor_id",
      as: "vendor",
    });
  };

  return VendorLedger;
};

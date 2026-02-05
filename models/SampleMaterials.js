module.exports = (sequelize, DataTypes) => {
  const SampleMaterials = sequelize.define(
    "SampleMaterials",
    {
      sample_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "orders",
          key: "order_id",
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      registered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      sample_code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      test_req: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      duedate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      club_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
    },
    {
      timestamps: false,
      tableName: "sample_materials",
    },
  );

  SampleMaterials.associate = (models) => {
    SampleMaterials.belongsTo(models.Orders, {
      foreignKey: "order_id",
      as: "order",
    });

    SampleMaterials.hasMany(models.SampleParam, {
      foreignKey: "sample_id",
      as: "params",
    });

    SampleMaterials.hasMany(models.Jobs, {
      foreignKey: "sample_id",
      as: "jobs",
    });

    SampleMaterials.belongsTo(models.Product, {
      foreignKey: "product_id",
      as: "product",
    });
    SampleMaterials.hasMany(models.SampleMaterialFields, {
      foreignKey: "club_id",
      sourceKey: "sample_id",
      as: "fields",
    });
  };

  return SampleMaterials;
};

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_lg: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      base_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      isOffer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      offer: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 100,
        },
      },
      prefix: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      complete_pack: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      no_of_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      interim_report: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      interim_report_days: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      features: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "products",
    },
  );

  Product.associate = (models) => {
    Product.hasMany(models.SampleMaterials, {
      foreignKey: "product_id",
      as: "samples",
    });

    Product.hasMany(models.Params, {
      foreignKey: "subgroup",
      as: "params",
    }); 
  };

  return Product;
};

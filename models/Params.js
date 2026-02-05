module.exports = (sequelize, DataTypes) => {
  const Params = sequelize.define(
    "Params",
    {
      param_id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      is_nabl: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      common_req: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      popular: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      subgroup: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
          onDelete: "CASCADE",
        },
        field: "subgroup",
      },
      params: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      additional_info: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      discipline: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      requirements: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: "params", // Define the table name explicitly
    },
  );

  Params.associate = (models) => {
    Params.hasMany(models.SampleParam, {
      foreignKey: "param_id",
      as: "sampleParams",
    });

    Params.belongsTo(models.Product, {
      foreignKey: "subgroup",
      as: "product",
    });
  };

  return Params;
};

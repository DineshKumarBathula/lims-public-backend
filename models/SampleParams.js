module.exports = (sequelize, DataTypes) => {
  const SampleParam = sequelize.define(
    "SampleParam",
    {
      param_pk: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      sample_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "sample_materials",
          key: "sample_id",
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
      params_info: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      finished: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      bench_record: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      report_values: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      param_price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "NOT_YET_ASSIGNED",
      },

      analyst: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: {
          model: "employee",
          key: "emp_id",
        },
      },
    },
    {
      timestamps: false,
      tableName: "sample_params",
    },
  );

  SampleParam.associate = (models) => {
    SampleParam.belongsTo(models.SampleMaterials, {
      foreignKey: "sample_id",
      as: "sample",
    });

    SampleParam.belongsTo(models.Params, {
      foreignKey: "param_id",
      as: "param",
    });

    SampleParam.belongsTo(models.Employee, {
      foreignKey: "analyst",
      as: "employee",
    });
  };

  return SampleParam;
};

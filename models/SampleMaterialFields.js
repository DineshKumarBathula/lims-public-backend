module.exports = (sequelize, DataTypes) => {
  const SampleMaterialFields = sequelize.define(
    "SampleMaterialFields",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      sample_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      club_id: {
        type: DataTypes.STRING,
        allowNull: false, // nullable unless you require it
      },
      field_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      field_value: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: false,
      tableName: "sample_material_fields",
      underscored: true,
    },
  );

  SampleMaterialFields.associate = (models) => {
    SampleMaterialFields.belongsTo(models.SampleMaterials, {
      foreignKey: "sample_id",
      as: "sample",
    });
  };

  return SampleMaterialFields;
};

module.exports = (sequelize, DataTypes) => {
  const ClubTests = sequelize.define(
    "ClubTests",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      club_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Unique club identifier",
      },
      test_requirement: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Stores test requirements in JSON format",
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
      tableName: "club_tests",
      timestamps: false, // change to true if you want Sequelize to auto-manage timestamps
      underscored: true,
    }
  );

  // Associations if needed later
  ClubTests.associate = (models) => {
    // Example:
    // ClubTests.belongsTo(models.SampleMaterials, {
    //   foreignKey: "club_id",
    //   targetKey: "club_id",
    //   as: "samples",
    // });
  };

  return ClubTests;
};

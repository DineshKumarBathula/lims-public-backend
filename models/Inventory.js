module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define(
    "inventory",
    {
      equip_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      equipment_name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      calibrated_by: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      equip_img: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      make: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      serial_number: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lab_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      equipment_range: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      least_count: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      calibration_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      due_calibration_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      measurement_uncertainty: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
          model: "employee",
          key: "emp_id",
        },
        field: "reviewed_by",
      },
      group: {
        type: DataTypes.STRING(55),
        allowNull: true,
      },
      discipline: {
        type: DataTypes.STRING(55),
        allowNull: true,
      },
      add_info: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // ⭐ Existing new fields
      division: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      i_data: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      // ⭐ NEW 3 COLUMNS FOR CALIBRATION IMAGE FILES
      calib_c1: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      calib_c2: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      calib_c3: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "inventory",
      timestamps: false,
    }
  );

  return Inventory;
};

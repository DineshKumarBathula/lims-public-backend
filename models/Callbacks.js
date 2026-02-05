module.exports = (sequelize, DataTypes) => {
  const Callback = sequelize.define(
    "callback",
    {
      request_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mobile: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          is: /^\d{10}$/,
        },
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      whatsapp_consent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      callrecording: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      addressed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      close_query: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      additional_info: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
    },
  );

  return Callback;
};

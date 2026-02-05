// module.exports = (sequelize, DataTypes) => {
//   const Client = sequelize.define(
//     "Client",
//     {
//       client_id: {
//         type: DataTypes.CHAR(36),
//         primaryKey: true,
//         allowNull: false,
//         defaultValue: DataTypes.UUIDV4,
//       },

//       customer_id: {
//         type: DataTypes.CHAR(36),
//         allowNull: false,
//       },

//       reporting_name: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       reporting_address: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       billing_name: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       billing_address: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       email: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       mobile: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       pan: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       gst: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       created_at: {
//         type: DataTypes.DATE,
//         allowNull: false,
//         defaultValue: DataTypes.NOW,
//       },

//       discount: {
//         type: DataTypes.FLOAT,
//         allowNull: true,
//         defaultValue: 0,
//       },
//     },
//     {
//       timestamps: false,
//       tableName: "clients",
//     },
//   );

//   Client.associate = (models) => {
//     Client.belongsTo(models.Customer, {
//       foreignKey: "customer_id",
//       as: "customer",
//       onDelete: "CASCADE",
//     });
//   };

//   return Client;
// };


module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    "Client",
    {
      client_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },

      customer_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
      },

      reporting_name: {
        type: DataTypes.STRING,
        allowNull: false, // required now
      },

      reporting_address: {
        type: DataTypes.STRING,
        allowNull: false, // required now
      },

    

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
          project_info: {
        type: DataTypes.STRING,
        allowNull: true, // optional, change to false if you want it mandatory
      },
    },
    {
      timestamps: false,
      tableName: "clients",
    }
  );

  Client.associate = (models) => {
    Client.belongsTo(models.Customer, {
      foreignKey: "customer_id",
      as: "customer",
      onDelete: "CASCADE",
    });
  };

  return Client;
};

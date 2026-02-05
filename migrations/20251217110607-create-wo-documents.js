module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("wo_documents", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      wo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      doc_type: {
        type: Sequelize.ENUM("PI", "TI", "ACK"),
        allowNull: false,
      },
      doc_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      file_urls: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("wo_documents");
  },
};

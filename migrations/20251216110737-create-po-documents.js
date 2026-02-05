"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("po_documents", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      po_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "purchaseorder",
          key: "po_id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      doc_type: {
        type: Sequelize.ENUM("PI", "TI", "ACK"),
        allowNull: false,
      },

      doc_date: {
        type: Sequelize.DATEONLY, // ✅ business date
        allowNull: false,
      },

      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      file_urls: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("po_documents");
    await queryInterface.sequelize.query(
      "DROP TYPE IF EXISTS enum_po_documents_doc_type;"
    ); // postgres safety
  },
};

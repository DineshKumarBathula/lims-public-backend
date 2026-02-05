'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('vendors_ledger', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      vendor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'vendors',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      po_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      bill_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      invoice_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      mode: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('vendors_ledger');
  },
};

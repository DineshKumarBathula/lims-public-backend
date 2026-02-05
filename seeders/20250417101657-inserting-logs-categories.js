"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("logs_category", [
      {
        lc_code: 1,
        lc_description: "Order recorded",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 2,
        lc_description: "New customer recorded",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 3,
        lc_description: "Quotation generated",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 4,
        lc_description: "Sample registered",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 5,
        lc_description: "Test assign",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 6,
        lc_description: "Test submission",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 7,
        lc_description: "Report dispatched",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        lc_code: 8,
        lc_description: "Requested to retest",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("logs_category", {
      lc_code: { [Sequelize.Op.in]: [1, 2, 3, 4, 5, 6, 7, 8] },
    });
  },
};

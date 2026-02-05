"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "role",
      [
        {
          role: "Chemical HOD",
          responsibilities: null,
          min_salary: 0,
          department: "LABORATORY_CHEMICAL",
        },
        {
          role: "Mechanical HOD",
          responsibilities: null,
          min_salary: 0,
          department: "LABORATORY_MECHANICAL",
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "role",
      {
        role: {
          [Sequelize.Op.in]: ["Software Engineer", "Data Analyst"],
        },
      },
      {},
    );
  },
};

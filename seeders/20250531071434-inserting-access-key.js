"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "access_keys",
      [
        {
          access_id: "KDM_HOD_TOKEN", // use uuid if required
          label: "HOD Module",
          description: null,
          added_at: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("access_keys", { access_id: "abc123" }, {});
  },
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Options", "questionId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Options", {
      fields: ["questionId"],
      type: "foreign key",
      references: {
        table: "Questions",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Options", "questionId");
  },
};

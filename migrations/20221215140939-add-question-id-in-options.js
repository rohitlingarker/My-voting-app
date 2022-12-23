"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Options", "questionId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    // await queryInterface.addConstraint("Options", {
    //   fields: ["questionId"],
    //   type: "foreign key",
    //   references: {
    //     table: "Questions",
    //     field: "id",
    //   },
    // });
    await queryInterface.sequelize.query(
      'ALTER TABLE "Options" ADD CONSTRAINT "Options_questionId_Questions_fk" FOREIGN KEY ("questionId") REFERENCES "Questions" (id) MATCH SIMPLE ON DELETE CASCADE'
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Options", "questionId");
  },
};

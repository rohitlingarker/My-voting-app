"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Questions", "electionId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "Questions" ADD CONSTRAINT "Questions_electionId_Elections_fk" FOREIGN KEY ("electionId") REFERENCES "Elections" (id) MATCH SIMPLE ON DELETE CASCADE'
    );

    // await queryInterface.addConstraint("Questions", {
    //   fields: ["electionId"],
    //   type: "foreign key",
    //   references: {
    //     table: "Elections",
    //     field: "id",
    //   },
    // });
  },

  async down(queryInterface, Sequelize) {
    // console.log("hi");
    await queryInterface.removeColumn("Questions", "electionId");
  },
};

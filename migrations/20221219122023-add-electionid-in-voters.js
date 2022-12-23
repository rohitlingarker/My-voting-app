"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Voters", "electionId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    // await queryInterface.addConstraint("Voters", {
    //   fields: ["electionId"],
    //   type: "foreign key",
    //   references: {
    //     table: "Elections",
    //     field: "id",
    //   },
    // });
    await queryInterface.sequelize.query(
      'ALTER TABLE "Voters" ADD CONSTRAINT "Voters_electionId_Elections_fk" FOREIGN KEY ("electionId") REFERENCES "Elections" (id) MATCH SIMPLE ON DELETE CASCADE'
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Voters", "electionId");
  },
};

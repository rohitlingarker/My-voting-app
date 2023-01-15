'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.addColumn("Elections", "userId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "Elections" ADD CONSTRAINT "Elections_userId_Users_fk" FOREIGN KEY ("userId") REFERENCES "Users" (id) MATCH SIMPLE ON DELETE CASCADE'
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("Elections","userId")
  }
};

"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Voters", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      voterName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Credentials already existing , Try Sign-in",
        },
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Email Required",
          },
        },
      },
      password: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Voters");
  },
};

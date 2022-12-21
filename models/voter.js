"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voter.belongsTo(models.Election, {
        foreignKey: "electionId",
      });
    }

    static async getAllVoters() {
      return await Voter.findAll();
    }
  }
  Voter.init(
    {
      voterName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Credentials already existing , Try Different Credentials",
        },
        validate: {
          notNull: true,
          len: {
            args: 1,
            msg: "Email Required",
          },
        },
      },
      password: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Voter",
    }
  );
  return Voter;
};

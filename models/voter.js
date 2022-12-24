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

    static async getAllVoters(id) {
      return await Voter.findAll({
        where: {
          electionId: id,
        },
      });
    }

    static async addVoter(data) {
      try {
        return await this.create({
          voterName: data.voterName,
          password: data.password,
          voteStatus: false,
          electionId: data.electionId,
        });
      } catch (error) {
        console.log(error);
      }
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }
    static async voted(id) {
      return await Voter.update(
        { voteStatus: true },
        {
          where: {
            id,
          },
        }
      );
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
      voteStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Voter",
    }
  );
  return Voter;
};

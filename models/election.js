"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Election.hasMany(models.Question, {
        foreignKey: "electionId",
        onDelete: 'CASCADE',
      });
      Election.hasMany(models.Voter, {
        foreignKey: "electionId",
        onDelete: 'CASCADE',
      });
    }
    static async getAllElections() {
      try {
        return await Election.findAll({
          order: [["id", "ASC"]],
        });
      } catch (error) {
        console.log(error);
      }
    }

    static async getAllOnGoingElections() {
      return await Election.findAll({
        where: {
          onGoingStatus: true,
        },
      });
    }

    async startAnElection() {
      return await this.update({ onGoingStatus: true });
    }

    async endAnElection() {
      return await this.update({ onGoingStatus: false });
    }
    async toggleElectionStatus() {
      const presentStatus = this.onGoingStatus;
      const updatedStatus = !presentStatus;
      return this.update({ onGoingStatus: updatedStatus });
    }

    static async createElection({ name }) {
      try {
        return await this.create({ name: name, onGoingStatus: false });
      } catch (error) {
        console.log(error);
      }
    }

    static async removeElection(id) {
      return await this.destroy({
        where: {
          id,
        },
        
      });
    }
  }
  Election.init(
    {
      name: DataTypes.STRING,
      onGoingStatus: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Election",
    }
  );
  return Election;
};

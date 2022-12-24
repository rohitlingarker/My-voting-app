"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Question.belongsTo(models.Election, {
        foreignKey: "electionId",
      });

      Question.hasMany(models.Option, {
        onDelete: "CASCADE",
        foreignKey: "questionId",
      });
    }
    static async getAllQuestions(id) {
      return await Question.findAll({
        where: {
          electionId: id,
        },
      });
    }

    static async addQuestion(data) {
      try {
        return await this.create({
          name: data.name,
          description: data.description,
          electionId: data.electionId,
        });
      } catch (error) {
        console.log(error);
      }
    }

    static async removeQuestion(id) {
      return await this.destroy({
        where: {
          id,
        },
        cascade: true,
      });
    }

    static async updateData(id, name, description) {
      return await Question.update(
        { name: name, description: description },
        {
          where: {
            id,
          },
        }
      );
    }
  }
  Question.init(
    {
      name: DataTypes.TEXT,
      description: DataTypes.TEXT,
      electionId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Question",
    }
  );
  return Question;
};

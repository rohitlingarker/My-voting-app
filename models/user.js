"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    /* eslint-disable no-unused-vars */
    static associate(models) {
      // define association here
      User.hasMany(models.Election, {
        onDelete: "CASCADE",
        foreignKey: "userId",
      });
    }
    static async allusers() {
      return this.findAll({});
    }

    static async deleteUser() {
      return this.destroy({ truncate: { cascade: true } });
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
      },
      lastName: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};

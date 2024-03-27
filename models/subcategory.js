"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class SubCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SubCategory.hasMany(models.Product);
      SubCategory.belongsTo(models.Category);
    }
  }
  SubCategory.init(
    {
      name_tm: DataTypes.STRING,
      name_ru: DataTypes.STRING,
      name_en: DataTypes.STRING,
      img: DataTypes.STRING,
      is_favorite: DataTypes.BOOLEAN,
      orderNum: DataTypes.INTEGER,
      active: DataTypes.BOOLEAN,
      deleted: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "SubCategory",
    }
  );
  return SubCategory;
};

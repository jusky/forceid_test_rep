/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Certificate_Info', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    hash: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    height: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'Certificate_Info'
  });
};

/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Application', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sKey: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    iKey: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    app_type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    account_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Account',
        key: 'id'
      }
    }
  }, {
    timestamps: false,
    tableName: 'Application'
  });
};

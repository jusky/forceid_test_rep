/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Group', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    gKey: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    group_name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    group_description: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    group_status: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    group_policy: {
      type: DataTypes.JSON,
      allowNull: true
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
    tableName: 'Group'
  });
};

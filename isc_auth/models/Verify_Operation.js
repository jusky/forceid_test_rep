/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Verify_Operation', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    address: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    app_iKey: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    app_type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    user_name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    credential_identifier: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    ip: {
      type: DataTypes.CHAR(39),
      allowNull: false
    },
    time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    method: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    result: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    data: {
      type: DataTypes.TEXT,
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
    tableName: 'Verify_Operation'
  });
};
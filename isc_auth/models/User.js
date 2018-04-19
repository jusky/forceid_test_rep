/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    uKey: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    user_name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    user_real_name: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    user_phone: {
      type: DataTypes.STRING(11),
      allowNull: true
    },
    user_email: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    user_status: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    credential_id_json: {
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
    },
    application_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Application',
        key: 'id'
      }
    },
    group_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Group',
        key: 'id'
      }
    }
  }, {
    timestamps: false,
    tableName: 'User'
  });
};

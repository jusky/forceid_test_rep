/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Account', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_superuser: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    is_staff: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    date_joined: {
      type: DataTypes.DATE,
      allowNull: false
    },
    account_name: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    account_phone: {
      type: DataTypes.STRING(11),
      allowNull: false
    },
    api_hostname: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true
    }
  }, {
    timestamps: false,
    tableName: 'Account'
  });
};

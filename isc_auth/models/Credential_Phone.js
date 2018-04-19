/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Credential_Phone', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    identifier: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    is_activated: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(11),
      allowNull: false
    },
    dKey: {
      type: DataTypes.STRING(256),
      allowNull: true
    },
    seed: {
      type: DataTypes.STRING(16),
      allowNull: true
    },
    device_name: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    device_model: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    user_id_json: {
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
    tableName: 'Credential_Phone'
  });
};

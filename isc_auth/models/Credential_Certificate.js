/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Credential_Certificate', {
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
    certificate_name: {
      type: DataTypes.STRING(30),
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
    },
    Certificate_Info_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Certificate_Info',
        key: 'id'
      }
    }
  }, {
    timestamps: false,
    tableName: 'Credential_Certificate'
  });
};

/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User_Credential', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'User',
        key: 'id'
      }
    },
    phone_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Credential_Phone',
        key: 'id'
      }
    },
    certificate_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'Credential_Certificate',
        key: 'id'
      }
    }
  }, {
    timestamps: false,
    tableName: 'User_Credential'
  });
};

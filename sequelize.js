// Read config
var settings = require('fs').readFileSync('./settings.json')
settings = JSON.parse(settings)

// DB
const Sequelize = require('sequelize')
const sequelize = new Sequelize(settings.DB_Name, settings.DB_User, settings.DB_Password, {
    host: settings.DB_Server,
    dialect: 'mysql',

    logging: false,
    
    pool: {
        max: 50,
        min: 5,
        acquire: 30000,
        idle: 10000
    }
})

// Models
const Account = sequelize.import(__dirname + "/isc_auth/models/Account")
const Application = sequelize.import(__dirname + "/isc_auth/models/Application")
const Group = sequelize.import(__dirname + "/isc_auth/models/Group")
const User = sequelize.import(__dirname + "/isc_auth/models/User")
const Credential_Phone = sequelize.import(__dirname + "/isc_auth/models/Credential_Phone")
const Certificate_Info = sequelize.import(__dirname + "/isc_auth/models/Certificate_Info")
const Credential_Certificate = sequelize.import(__dirname + "/isc_auth/models/Credential_Certificate")
const Verify_Operation = sequelize.import(__dirname + "/isc_auth/models/Verify_Operation")

// Relations
Application.belongsTo(Account, {foreignKey: 'account_id'})
Credential_Certificate.belongsTo(Account, {foreignKey: 'account_id'})
Credential_Certificate.belongsTo(Certificate_Info, {foreignKey: 'Certificate_Info_id'})
Credential_Phone.belongsTo(Account, {foreignKey: 'account_id'})
Group.belongsTo(Account, {foreignKey: 'account_id'})
User.belongsTo(Account, {foreignKey: 'account_id'})
User.belongsTo(Application, {foreignKey: 'application_id'})
User.belongsTo(Group, {foreignKey: 'group_id'})
Verify_Operation.belongsTo(Account, {foreignKey: 'account_id'})

// Exports
module.exports.sequelize = sequelize
module.exports.Application = Application
module.exports.Group = Group
module.exports.User = User
module.exports.Account = Account
module.exports.Credential_Phone = Credential_Phone
module.exports.Credential_Certificate = Credential_Certificate
module.exports.Verify_Operation = Verify_Operation
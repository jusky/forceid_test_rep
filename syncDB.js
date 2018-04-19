var settings = require('fs').readFileSync('settings.json')
settings = JSON.parse(settings)

const Sequelize = require('sequelize');
const sequelize = new Sequelize(settings.DB_Name, settings.DB_User, settings.DB_Password, {
  host: settings.DB_Server,
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Models
const Account = sequelize.import(__dirname + "/isc_auth/models/Account")
const Application = sequelize.import(__dirname + "/isc_auth/models/Application")
const Group = sequelize.import(__dirname + "/isc_auth/models/Group")
const User = sequelize.import(__dirname + "/isc_auth/models/User")
const Credential_Phone = sequelize.import(__dirname + "/isc_auth/models/Credential_Phone")
const Certificate_Info = sequelize.import(__dirname + "/isc_auth/models/Certificate_Info")
const Credential_Certificate = sequelize.import(__dirname + "/isc_auth/models/Credential_Certificate")
const Verify_Operation = sequelize.import(__dirname + "/isc_auth/models/Verify_Operation")

// Create Tables
async function createTable() {
    await Account.sync({force: true})
    await Application.sync({force: true})
    await Group.sync({force: true})
    await User.sync({force: true})
    await Credential_Phone.sync({force: true})
    await Certificate_Info.sync({force: true})
    await Credential_Certificate.sync({force: true})
    await Verify_Operation.sync({force: true})
    sequelize.close()
}

createTable()
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

async function updateExample() {
    // Create account
    var account = await Account.create({
        password: 'pbkdf2_sha256$36000$NiX5KKBTXaqR$FKKp3e86lq33EqBabI9twyu5sqhIFm3WiVPPS7h/UNo=',
        last_login: '2018-01-15 15:47:17.627119',
        is_superuser: false,
        email: 'q@aka.moe',
        is_staff: false,
        is_active: true,
        date_joined: '2018-01-03 08:15:40.748373',
        account_name: 'Quincy',
        account_phone: '18607104603',
        api_hostname: '7RbozOwa'
    })
    var group = await Group.create({
        gKey: 'zmr76AZmaSJz2LH9s8hd',
        group_name: 'Default',
        group_status: 'Active',
        account_id: account.id
    })
    var application = await Application.create({
        sKey: 'maajDYYlXrVc2XDqaRElPdBZUDMmKr5HNIRtzyIA',
        iKey: '4bJBT7CvsERgeRZFrsQD',
        name: 'Web SDK1514967377',
        app_type: 'Web SDK',
        is_admin: false,
        account_id: account.id
    })
    sequelize.close()
}

updateExample()
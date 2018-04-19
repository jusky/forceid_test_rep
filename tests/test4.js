// DB
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const sequelize = new Sequelize('verifydatabase', 'quincyhuang', 'quincyhuang123!', {
    host: '182.254.221.228',
    dialect: 'mysql',
    
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
})

const Application = sequelize.import("../isc_auth/models/dashboard_application")
const Device = sequelize.import("../isc_auth/models/dashboard_device")
const Group = sequelize.import("../isc_auth/models/dashboard_group")
const Operation = sequelize.import("../isc_auth/models/dashboard_operation")
const User = sequelize.import("../isc_auth/models/dashboard_user")
const Account = sequelize.import("../isc_auth/models/users_account")
const django_content_type = sequelize.import("../isc_auth/models/django_content_type")

Application.belongsTo(Account, {foreignKey: 'account_id'})
User.belongsTo(Account, {foreignKey: 'account_id'})
User.belongsTo(Application, {foreignKey: 'application_id'})
User.belongsTo(Group, {foreignKey: 'group_id'})
Device.belongsTo(Account, {foreignKey: 'account_id'})
Device.belongsTo(Application, {foreignKey: 'application_id'})
Device.belongsTo(User, {foreignKey: 'user_id'})

async function test() {
    try {
        var user = await User.findOne({include: [{model: Device, where: { identifer: 'vhFksL8QJ7qEVck8egjL' }}]})
        console.log(user.Device.device_name)
        
    } catch (e) {
        console.log(e)
    }
}

test()
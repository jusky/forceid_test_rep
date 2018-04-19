// Dependencies
var app_auth_tools = require('./app_auth_tools')

// Initialization
var myCache = require('../cache')
var db = require('../sequelize')

var Application = db.Application
var Device = db.Device
var Group = db.Group
var Operation = db.Operation
var User = db.User
var Account = db.Account
var django_content_type = db.django_content_type

// Constants
const START_TIME = 10
const SCAN_TIME = 9

// Functions
async function start_wifi_collect(api_hostname, identifier) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    await sleep(3000)
    var device = await Device.findOne({ where: { identifer: identifier } })
    var key = device.dKey

    var start_time = Date.now() + START_TIME
    var start_seq = 1

}

async function wifi_data_check(api_hostname, identifier) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Exports
exports.start_wifi_collect = start_wifi_collect
exports.wifi_data_check = wifi_data_check
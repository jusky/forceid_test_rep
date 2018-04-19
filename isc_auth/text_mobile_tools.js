// Dependencies
var request = require('request')
var crypto = require('crypto')

// Constants
const message_function = 'Messages'
const call_function = 'Calls'
const message_operation = 'templateSMS'
const call_operation = 'voiceCode'

// const appId = '4e89b79fee3c440f92ec84607b5a3468';
const appId = '7f8d531c871143dfb17e4e74b8979fc2'
// const templateId = 40166;
const templateId = 233159
const SoftVersion = '2014-06-30'
// const AccountSid = '99cf6324d1625cf434ef4a9b893bbcdc';
const AccountSid = 'f33bdf47c0394fbb4aea079ddc3938c4'
// const token = '37da64eea931655922d0bb474d52edb2';
const token = '2c9714676100744ec1cf09552449e997'
const baseURL = 'https://api.ucpaas.com'

// Functions

//   __get_general_aug
function __get_general_aug(action_type) {
    function toDub(n) { return n < 10 ? '0' + n : n }
    
    function getTimeStr() {
        var date = new Date();
        return date.getFullYear().toString() + toDub(date.getMonth() + 1) + toDub(date.getDate()) + toDub(date.getHours()) + toDub(date.getMinutes()) + toDub(date.getSeconds());
    }

    var timeStr = getTimeStr()
    var SigParameter = crypto.createHash('md5').update(AccountSid + token + timeStr).digest('hex').toUpperCase()
    var bytes = AccountSid + ':' + timeStr
    var Authorization = Buffer.from(bytes, 'utf8').toString('base64')

    var functions = ''
    var operation = ''
    if (action_type == 'sms') {
        functions = message_function
        operation = message_operation
    } else if (action_type = 'call') {
        functions = call_function
        operation = call_operation
    }
    var headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json",
        "Authorization": Authorization
    }
    var url = `${baseURL}/${SoftVersion}/Accounts/${AccountSid}/${functions}/${operation}/?sig=${SigParameter}`
    return [url, headers]
}

//   __call
function __call(phone_number, auth_code) {
    var back = __get_general_aug('call')
    var url = back[0]
    var headers = back[1]
    var options = {
        url: url,
        headers: headers,
        data: {
            voiceCode: {
                appId: appId,
                verifyCode: auth_code,
                playTimes: '3',
                to: phone_number
            }
        }
    }
    request.post(options, (error, response, body) => {
        console.log(body)
    })
}

//   __send_sms
function __send_sms(phone_number, auth_code, wait_time) {
    console.log('send_sms called')
    var back = __get_general_aug('sms')
    var url = back[0]
    var headers = back[1]
    var data = {templateSMS: {appId: appId, param: [auth_code, wait_time].join(','), templateId: templateId, to: phone_number}}
    var options = {
        url: url,
        headers: headers,
        body: JSON.stringify(data)
    }
    request.post(options, (error, response, body) => {
        if (error) console.log(error)
        console.log(body)
    })
}

//   action
function action(phone_number, auth_code, wait_time, action_type) {
    console.log('action called')
    if (action_type == 'sms') {
        __send_sms(phone_number, auth_code, wait_time)
    } else if (action_type == 'call') {
        __call(phone_number, auth_code)
    }
}

// Exports
exports.action = action
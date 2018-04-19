// Dependencies
var rp = require('request-promise-native')

// Blockchain parameters
const SCHEMA = 'http'
const HOST = '54.222.210.78'
const PORT = 8081
const PATH = 't1'

async function sendToBlockchain(message) {
    var postURL = `${SCHEMA}://${HOST}:${PORT}/${PATH}`
    var messageProcessed = JSON.stringify(message)
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': messageProcessed.length
    }
    try {
        var response = await rp({
            uri: postURL,
            method: 'POST',//提交方式
            headers: headers,
            body: messageProcessed
        })
    } catch (e) {
        response = null
    }
    return response
}

// Exports
exports.sendToBlockchain = sendToBlockchain
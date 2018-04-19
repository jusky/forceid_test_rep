// Dependencies
const path = require('path')
const url = require('url')

// Module
module.exports = function(req, res, next) {
    var myDate = new Date()
    var message = '[' + myDate.toLocaleString() + '] ' + req.method + ' ' + req.originalUrl
    console.log(message)
    next()
}
var app_auth_tools = require('./isc_auth/app_auth_tools')

var key = 'dpYnWpwDSTQu1KfKSQ8uGsxxANfIAgIq'
var prefix = 'SYN'
var text = 'HELLO'

var ret = app_auth_tools.gen_b64_random_and_code(key, app_auth_tools.CONNECTION_SETUP_PREFIX)
var random_number = ret[0]
var code = ret[1]

console.log('random', random_number, 'code', code)

var clientsend = 'ZcyVS9HZAUSMTKBpzaWsqGxqt+wgWooGIpAOGePFifc='
var serversend = '75ybnG8PGtpf8xFTXt5uWFmwbMv5glfAGgAv0Dh9fF4='

var buffer = Buffer.from(code, 'base64')
var a = app_auth_tools.decrypt(key, buffer)
console.log(a)
var app_auth_tools = require('./isc_auth/app_auth_tools')

var key = 'dWkV3HfqIbMVkWonlwf9N9yBgthabMR2'

var serversend = 'uZI8lwqdJKCztggzLRi+A5A+67yvqpNNNYNvlgUkIgIwN4e7146zAiee5pNvL7X7p0yedRfr1e6NzdhDMOSaOsC8YlZEuseBEW8iHKJr30dYxwBq3A59nSPQbeu5SX1gi8JXRzGjyruWeyO3FwvFWUKpaMKiqBQ5lKKbjAzr1jyVk3g9IBju7qnFay/Dyv07'
var clientsend = 'UwnN/OyCzZWZfvVaWnklrcaMYPsLAKCU9MM4+KZxd1ru5waiNkRs2/qebmJ4ucCU/WSg6W4y86zZ5sBO5qPgWQwxqrUlfGMemYEc3GPeiHY='
var a = app_auth_tools.decrypt_json_to_object(clientsend, key)
var b = app_auth_tools.decrypt_json_to_object(serversend, key)

// a = a.info
// a = a.split('\0')

console.log(a)
console.log(b)
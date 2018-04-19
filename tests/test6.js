var notp = require('notp')
var base32 = require('thirty-two')



var seed = 'LAHPKCUFOJMNYVCK'
// var seed = createRandomSeed(16)
var key = base32.decode(seed)
console.log(seed)

var server_random_code = notp.totp.gen(key, {time: 30})
var result = notp.totp.verify(server_random_code, key, {window: 1, time: 30})
console.log(server_random_code, result)
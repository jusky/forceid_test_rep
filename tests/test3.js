// Dependencies
var base32 = require('thirty-two')
var qr = require('qr-image')
var fs = require('fs')

// Seed for lcs
var key = 'LLNCQGFNREUNQYPK'

// encoded will be the secret key, base32 encoded
var encoded = base32.encode(key)
var encodedForGoogle = encoded.toString().replace(/=/g,'')
console.log(encodedForGoogle)
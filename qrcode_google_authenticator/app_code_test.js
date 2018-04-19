// Dependencies
var base32 = require('thirty-two')
var qr = require('qr-image')
var fs = require('fs')

// Seed for lcs
var key = '7PSKBT2VC3VBEGHV'

// encoded will be the secret key, base32 encoded
// var encoded = base32.encode(key)

// Google authenticator doesn't like equal signs
// var encodedForGoogle = encoded.toString().replace(/=/g,'')

var uri = 'otpauth://totp/hz?secret=' + key + '&issuer=ISC_auth'
console.log(uri)
var img = qr.image(uri)
img.pipe(fs.createWriteStream('codeForGoogleAuthenticator.png'))
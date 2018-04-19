// Dependencies
const fs = require('fs')
var express = require('express')
var explicit_auth = require('./isc_auth/explicit_auth')

// Router
var router = express.Router()

// Read settings
var settings = fs.readFileSync('settings.json')
settings = JSON.parse(settings)

// Path regular expressions
const url_hostname = /^\/api-[a-zA-Z0-9]+\/frame\/auth\/$/
const url_hostname_identifer = /^\/api-[a-zA-Z0-9]+\/[a-zA-Z0-9]{20}\/frame\/auth_check_ws\/$/

// Routes
//   API Root
router.get('/', (req, res) => {
    res.send('Back-end API Root OK.')
})
//   pre_auth
router.get(/^\/api-([a-zA-Z0-9]+)\/frame\/auth\/$/, explicit_auth.auth_pre)
//   enroll
router.all(/^\/api-([a-zA-Z0-9]+)\/frame\/enroll\/$/, explicit_auth.enroll)
//   do_enroll
router.all(/^\/api-([a-zA-Z0-9]+)\/frame\/do_enroll\/$/, explicit_auth.do_enroll)
//   auth_check_ws
router.get(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/auth_check_ws\/$/, explicit_auth.auth_check_ws)
//   push_auth
router.get(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/push_auth\/$/, explicit_auth.push_auth)
//   auth_redirect
router.get(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/auth_redirect\/$/, explicit_auth.auth_redirect)
//   bind_device
router.all(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/bind_device\/$/, explicit_auth.bind_device)
//   check_bind
router.post(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/check_bind\/$/, explicit_auth.check_bind)
//   text_auth
router.all(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/text_auth\/$/, explicit_auth.sms_call_auth)
//   app_code_auth
router.post(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/app_code_auth\/$/, explicit_auth.app_code_auth)
//   getPCUrl
// router.get(/^\/api-([a-zA-Z0-9]+)\/frame\/getPCUrl\/$/, explicit_auth.getPCUrl)
//   pctest
// router.get(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/pctest\/$/, explicit_auth.pctest)
//   startwificollect
// router.get(/^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/frame\/startwificollect\/$/, explicit_auth.startwificollect)

// Export
module.exports = router
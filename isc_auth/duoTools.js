// Dependencies
const crypto = require('crypto')

// Important constants
//   Prefix
const DUO_PREFIX = 'TX'
const AUTH_PREFIX = 'AUTH'

//   Expire time
const EXPIRETIME = 60

//   Standard key length
const IKEY_LEN = 20
const SKEY_LEN = 40
const AKEY_LEN = 40

//   Error messages
const ERR_USER = 'ERR|The username passed to sign_request() is invalid.'
const ERR_IKEY = 'ERR|The Duo integration key passed to sign_request() is invalid.'
const ERR_SKEY = 'ERR|The Duo secret key passed to sign_request() is invalid.'
const ERR_AKEY = 'ERR|The application secret key passed to sign_request() must be at least ' + AKEY_LEN + ' characters.'
const ERR_USER_ENCODING = 'ERR|The username passed to sign_request() could not be encoded.'
const ERR_UNKNOWN = 'ERR|An unknown error has occurred.'

// Functions
//   Parse duo sig
// 拆分sig，返回{'prefix':prefix,
// 'content':(username,iKey,expiretime),
// 'sha_1':加密信息}
// 并检查格式，若格式错误则返回抛出异常
function parseDuoSig(sig) {
    var s = sig.split('|')
    if (s.length != 3) {
        throw new Error('DuoFormatException')
    }
    var prefix = s[0]
    var cookie = s[1]
    var sha_1 = s[2]
    try {
        var cookieByte = Buffer.from(cookie, 'base64').toString('utf8')
    } catch(e) {
        throw new Error('DuoFormatException')
    }
    s = cookieByte.split('|')
    if (s.length != 3) throw new Error('DuoFormatException')
    var userName = s[0]
    var iKey = s[1]
    var expiretime = s[2]
    var ret = {
        'prefix': prefix,
        'content': s,
        'sha_1': sha_1
    }
    // console.log(ret)
    return ret
}

//   Hash function
function _hmac_sha1(key, msg) {
    const hash = crypto.createHmac('sha1', key).update(msg).digest('hex')
    return hash
}

//   验证前缀是否合法，验证加密信息是否正确加密
function validateParams(sigDicts, sKey) {
    if (sigDicts.prefix != DUO_PREFIX) return false
    var contentStr = Buffer.from(sigDicts.content.join('|')).toString('utf8')
    var cookie = [DUO_PREFIX, Buffer.from(contentStr).toString('base64')].join('|')
    var newSig = _hmac_sha1(sKey, cookie)
    if (_hmac_sha1(sKey, newSig) != _hmac_sha1(sKey, sigDicts.sha_1)) return false
    return true
}

//   验证user是否已经enroll，若是返回user，否则返回None
function checkUserEnrolled(userName) {
    db.get('SELECT * FROM  users_account WHERE account_name = ?', userName, (err, rows) => {
        if (err) {
            console.log(err)
            return null
        } else {
            if (!rows) return null
            else return rows
        }
    })
}

//   返回response的参数值，更新expiretime,prefix
function signResponse(sigDicts, sKey) {
    sigDicts.content[sigDicts.content.length - 1] = (parseInt(Date.now() / 1000) + EXPIRETIME).toString()
    var contentStr = sigDicts.content.join('|')
    var cookie = [AUTH_PREFIX, Buffer.from(contentStr).toString('base64')].join('|')
    var newSig = _hmac_sha1(sKey, cookie)
    return [cookie, newSig].join('|')
}

//   Generate 'sign_request'
function _sign_vals(key, vals, prefix, expire) {
    // Expire time
    var exp = (parseInt(Date.now() / 1000) + expire).toString()
    // To Base64
    var b64 = [vals[0], vals[1], exp].join('|')
    b64 = Buffer.from(b64).toString('base64')
    // Append prefix
    var cookie = [prefix, b64].join('|')
    // Hash
    var sig = _hmac_sha1(Buffer.from(key).toString('utf8'), Buffer.from(cookie).toString('utf8'))
    // Return cookie|Hash(cookie, key)
    return [cookie, sig].join('|')
}

//   Parse 'sig' duo服务器返回的response其实就是request的duo_sig前缀修改后的sig
function _parse_vals(key, val, prefix, ikey) {
    // Current time
    const ts = parseInt(Date.now() / 1000)
    // b64中包括返回的base64编码的username,iKey和过期时间
    var splitresult = val.split('|')
    const u_prefix = splitresult[0]
    const u_b64 = splitresult[1]
    const u_sig = splitresult[2]
    // 产生新的cookie，用key加密这个cookie，若验证response则为sKey，验证app_sig则为aKey，对返回的sig和新生成的sig同时HASH验证是否相等
    var cookie = [u_prefix, u_b64].join('|')
    const e_key = Buffer.from(key).toString('utf8')
    const e_cookie = Buffer.from(cookie).toString('utf8')
    var sig = _hmac_sha1(e_key, e_cookie)
    var va = _hmac_sha1(e_key, Buffer.from(sig).toString('utf8'))
    var vb = _hmac_sha1(e_key, Buffer.from(u_sig).toString('utf8'))
    if (va != vb) return null
    if (u_prefix != prefix) return null
    var decoded = Buffer.from(u_b64, 'base64').toString('utf8')
    var decodedsplit = decoded.split('|')
    var user = decodedsplit[0]
    var u_ikey = decodedsplit[1]
    var exp = decodedsplit[2]
    // 验证iKey，时间
    if (u_ikey != ikey) return null
    if (ts >= parseInt(exp)) return null
    return user
}

// Generate a signed request for Duo authentication.
// The returned value should be passed into the Duo.init() call
// in the rendered web page used for Duo authentication.
// Arguments:
// ikey      -- Duo integration key
// skey      -- Duo secret key
// akey      -- Application secret key
// username  -- Primary-authenticated username
// prefix    -- DUO_PREFIX or ENROLL_REQUEST_PREFIX
function _sign_request(ikey, skey, akey, username, prefix) {
    // check early if username can be successfully encoded
    try {
        Buffer.from(username).toString('utf8')
    } catch(e) {
        return ERR_USER_ENCODING
    }

    if (!username) return ERR_USER
    if (username.indexOf('|') != -1) return ERR_USER
    if (!ikey || ikey.length != IKEY_LEN) return ERR_IKEY
    if (!skey || skey.length != SKEY_LEN) return ERR_SKEY
    if (!akey || akey.length != AKEY_LEN) return ERR_AKEY

    vals = [username, ikey]
    // 生成duo_sig和app_sig
    try {
        duo_sig = _sign_vals(skey, vals, prefix, DUO_EXPIRE)
        app_sig = _sign_vals(akey, vals, APP_PREFIX, APP_EXPIRE)
    } catch (e) {
        return ERR_UNKNOWN
    }
    return [duo_sig, app_sig].join('|')
}

// Generate a signed request for Duo authentication.
// The returned value should be passed into the Duo.init() call
// in the rendered web page used for Duo authentication.
// Arguments:
// ikey      -- Duo integration key
// skey      -- Duo secret key
// akey      -- Application secret key
// username  -- Primary-authenticated username
function sign_request(ikey, skey, akey, username) {
    return _sign_request(ikey, skey, akey, username, DUO_PREFIX)
}

// Generate a signed request for Duo authentication.
// The returned value should be passed into the Duo.init() call
// in the rendered web page used for Duo authentication.
// Arguments:
// ikey      -- Duo integration key
// skey      -- Duo secret key
// akey      -- Application secret key
// username  -- Primary-authenticated username
function sign_enroll_request(ikey, skey, akey, username) {
    return _sign_request(ikey, skey, akey, username, ENROLL_REQUEST_PREFIX)
}

// Validate the signed response returned from Duo.
// Returns the username of the authenticated user, or None.
// Arguments:
// ikey          -- Duo integration key
// skey          -- Duo secret key
// akey          -- Application secret key
// prefix        -- AUTH_PREFIX or ENROLL_PREFIX that sig_response
//                  must match
// sig_response  -- The signed response POST'ed to the server
//   验证response，包括验证duo返回的response以及本地的app_sig
function _verify_response(ikey, skey, akey, prefix, sig_response) {
    try {
        var splitresult = sig_response.split(':')
        var auth_sig = splitresult[0]
        var app_sig = splitresult[1]
        var auth_user = _parse_vals(skey, auth_sig, AUTH_PREFIX, ikey)
        var app_user = _parse_vals(akey, app_sig, APP_PREFIX, ikey)
    } catch (e) {
        return null
    }
    if (auth_user != app_user) return null
    return auth_user
}

// Validate the signed response returned from Duo.
// Returns the username of the authenticated user, or None.
// Arguments:
// ikey          -- Duo integration key
// skey          -- Duo secret key
// akey          -- Application secret key
// sig_response  -- The signed response POST'ed to the server
function verify_response(ikey, skey, akey, sig_response) {
    return _verify_response(ikey, skey, akey, AUTH_PREFIX, sig_response)
}

// Validate the signed response returned from Duo.
// Returns the username of the enrolled user, or None.
// Arguments:
// ikey          -- Duo integration key
// skey          -- Duo secret key
// akey          -- Application secret key
// sig_response  -- The signed response POST'ed to the server
function verify_enroll_response(ikey, skey, akey, sig_response) {
    return _verify_response(ikey, skey, akey, ENROLL_PREFIX, sig_response)
}

// Exports
exports.parseDuoSig = parseDuoSig
exports._hmac_sha1 = _hmac_sha1
exports.validateParams = validateParams
exports.checkUserEnrolled = checkUserEnrolled
exports.signResponse = signResponse
exports._sign_vals = _sign_vals
exports._parse_vals = _parse_vals
exports._sign_request = _sign_request
exports.sign_request = sign_request
exports.sign_enroll_request = sign_enroll_request
exports._verify_response = _verify_response
exports.verify_response = verify_response
exports.verify_enroll_response = verify_enroll_response
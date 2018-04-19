// Dependencies
var crypto = require('crypto')
var qr = require('qr-image')

// Constants
const CONNECTION_SETUP_PREFIX = "SYN"
const CONNECTION_REPLY_PREFIX = "ACK"
const EXPLICIT_SUCCEED_PREFIX = "SUCCEED"
const EXPLICIT_DENIED_PREFIX = "FAILED"

const EXPLICIT_AUTH_TYPE = "autopush"
const EXPLICIT_REPLY_COMMAND = "EXPLICIT"
const REQUIRE_INFO_COMMAND = "REQUIRE"
const WIFI_REPLY_COMMAND = "WIFIREPLY"
const WIFI_DATA_COMMAND = "WIFIDATA"

// Functions
//   createRandomFields
function createRandomFields(size) {
    var choice = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'

    function getAnIndex() {
        return Math.floor(Math.random() * 61)
    }

    var result = ''
    for (var i = 0; i < size; i++) result += choice[getAnIndex()]
    return result
}

// createRandomSeed
function createRandomSeed(size) {
    var choice = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

    function getAnIndex() {
        return Math.floor(Math.random() * 31)
    }

    var result = ''
    for (var i = 0; i < size; i++) result += choice[getAnIndex()]
    return result
}

//   生成服务器认证码,返回随机数和认证码（随机20字节）
function gen_b64_encrypt_explicit_auth_code(key, data) {
    if (data == undefined) data = {}
    var random_number = createRandomFields(20)
    var cookie = JSON.stringify({
        'type': EXPLICIT_AUTH_TYPE,
        'random': random_number,
        'data': data
    })
    return [random_number, encrypt(key, cookie).toString('base64')]
}

//   生成服务器认证码,未加密以及  base64编码,返回认证码（随机20字节）
function gen_b64_random_and_code(key, prefix, data) {
    var random_number = createRandomFields(20)
    var cookie = prefix
    if (data != undefined) {
        cookie += `\0${data}`
    } else {
        cookie += `\0${random_number}`
    }
    var e = encrypt(key, cookie)
    return [random_number, e.toString('base64')]
}

//   b64(AES(json)) => json Object
function decrypt_json_to_object(e, key) {
    var b64 = Buffer.from(e, 'base64')
    var d = decrypt(key, b64)
    return JSON.parse(d.toString('utf8'))
}

//   检验客户端回传随机数及前缀合法性，并返回除验证随机数以外的内容
function validate_info(info, random_number, prefix) {
    info = info.split('\0')
    random_number = random_number.split('')
    random_number.reverse()
    random_number = random_number.join('')
    if (random_number != info[info.length - 1]) throw new Error('AuthFailedError')
    if (prefix != undefined) {
        if (info[0] != prefix) throw new Error('AuthFailedError')
    }
    info.pop()
    return info
}

//   解密客户端回传信息，检验其随机数及前缀合法性，并返回除验证随机数以外的内容
function decrypt_and_validate_info(e, key, random_number, prefix) {
    return validate_info(decrypt(key, Buffer.from(e, 'base64')), random_number, prefix)
}

//   生成验证码
function generate_captcha(api_hostname, identifier, dKey) {
    var b64_device = Buffer.from(identifier).toString('base64')
    var b64_key = Buffer.from(dKey).toString('base64')
    var b64_api_hostname = Buffer.from(api_hostname).toString('base64')
    var content = `Auth://${b64_key}-${b64_device}-${b64_api_hostname}`
    // 二维码格式变成png且有所变化，注意debug
    var imgBuffer = qr.imageSync(content, {size: 12, margin: 1})
    return imgBuffer.toString('base64')
}

//   生成256位AES秘钥
function generate_aes_key() {
    return createRandomFields(32)
}

function base64_encrypt(key, text) {
    return encrypt(key, text).toString('base64')
}

//   Encrypt
function encrypt(key, text) {
    // 这里密钥key 长度必须为16（AES-128）,
    // 24（AES-192）,或者32 （AES-256）Bytes 长度
    // 目前AES-128 足够目前使用
    var cipher = crypto.createCipheriv('aes-256-cbc', key, '0000000000000000')
    cipher.setAutoPadding(false)
    var textOriginalBuffer = Buffer.from(text, 'utf8')

    var length = 16
    var count = textOriginalBuffer.byteLength
    if (count < length) {
        // \0 backspace
        for (var i = 0; i < length - count; i++) text += '\0'
    } else if (count > length) {
        for (var i = 0; i < length - (count % length); i++) text += '\0'
    }
    
    var textBuffer = Buffer.from(text, 'utf8')
    // console.log(textBuffer)
    var ciphertext1 = cipher.update(textBuffer)
    var ciphertext2 = cipher.final()
    var ciphertext = Buffer.concat([ciphertext1, ciphertext2])
    return ciphertext
}

//   Decrypt
function decrypt(key, text) {
    var decipher = crypto.createDecipheriv('aes-256-cbc', key, '0000000000000000')
    decipher.setAutoPadding(false)
    var plaintext1 = decipher.update(text)
    var plaintext2 = decipher.final()
    var plaintext = Buffer.concat([plaintext1, plaintext2])

    function rstripBackslashZero(text) {
        var a = text.split('')
        while (a[a.length - 1] == '\0') a.pop()
        var ret = a.join('')
        return ret
    }

    plaintext = rstripBackslashZero(plaintext.toString('utf8'))
    return plaintext
}

// Exports
exports.createRandomFields = createRandomFields
exports.createRandomSeed = createRandomSeed
exports.gen_b64_encrypt_explicit_auth_code = gen_b64_encrypt_explicit_auth_code
exports.gen_b64_random_and_code = gen_b64_random_and_code
exports.decrypt_json_to_object = decrypt_json_to_object
exports.validate_info = validate_info
exports.decrypt_and_validate_info = decrypt_and_validate_info
exports.generate_captcha = generate_captcha
exports.generate_aes_key = generate_aes_key
exports.base64_encrypt = base64_encrypt
exports.encrypt = encrypt
exports.decrypt = decrypt

exports.CONNECTION_SETUP_PREFIX = CONNECTION_SETUP_PREFIX
exports.CONNECTION_REPLY_PREFIX = CONNECTION_REPLY_PREFIX
exports.EXPLICIT_SUCCEED_PREFIX = EXPLICIT_SUCCEED_PREFIX
exports.EXPLICIT_DENIED_PREFIX = EXPLICIT_DENIED_PREFIX

exports.EXPLICIT_AUTH_TYPE = EXPLICIT_AUTH_TYPE
exports.EXPLICIT_REPLY_COMMAND = EXPLICIT_REPLY_COMMAND
exports.REQUIRE_INFO_COMMAND = REQUIRE_INFO_COMMAND
exports.WIFI_REPLY_COMMAND = WIFI_REPLY_COMMAND
exports.WIFI_DATA_COMMAND = WIFI_DATA_COMMAND
// Dependencies
const fs = require('fs')
const path = require('path')
const url = require('url')
var notp = require('notp')
var base32 = require('thirty-two')
var rp = require('request-promise-native')
var duoTools = require('./duoTools')
var text_mobile_tools = require('./text_mobile_tools')
var app_auth_tools = require('./app_auth_tools')
var wifi_auth_tools = require('./wifi_auth_tools')
var blockchain = require('./blockchain')

// Initialization
var myCache = require('../cache')
var db = require('../sequelize')

// Models
var Application = db.Application
var Group = db.Group
var User = db.User
var Account = db.Account
var Credential_Phone = db.Credential_Phone
var Credential_Certificate = db.Credential_Certificate
var Verify_Operation = db.Verify_Operation

// Functions
//   auth_pre
async function auth_pre(req, res) {
    // Get api_hostname
    var api_hostname = req.params[0]
    try {
        // Get account from api_hostname
        var account = await Account.findOne({ where: { api_hostname: api_hostname } })
        if (!account) {
            // No account found
            return res.status(403).send('No such account.')
        } else {
            var tx = req.query.tx
            var sig = duoTools.parseDuoSig(tx)
            var iKey = sig.content[1]
            // try get Application
            var application = await Application.findOne({ where: { iKey: iKey }, include: [{model: Account, where: { api_hostname: api_hostname } }] })
            if (!application) {
                // No application found
                return res.status(403).send('No such application.')
            } else {
                var sKey = application.sKey
                if (!duoTools.validateParams(sig, sKey)) return res.status(403).send('Sig is wrongly formatted or wrongly encrypted.')
                else {
                    // Good request ikey and api_hostname found and match and properly encrypted
                    var userName = sig.content[0]
                    req.session.sig_dict = sig
                    req.session.parent = req.query.parent
                    req.session.sKey = sKey
                    req.session.iKey = iKey
                    var user = await User.findOne({ where: { user_name: userName }, include: [{ model: Application, where: { id: application.id } }, Account] })
                    if (!user) {
                        // redirect to enroll
                        var enroll_url = `/api-${api_hostname}/frame/enroll/`
                        return res.redirect(enroll_url)
                    } else {
                        // 存在User
                        var credential_id_json = user.credential_id_json    // 注意 当User是批量导入的时候，需要加上user_phone以进行第一次绑定
                        // 如果有就取phone，没有就创建一个
                        var phone = await Credential_Phone.findOrCreate({ where: { phone_number: user.user_phone }, defaults: {
                            identifier: app_auth_tools.createRandomFields(20),
                            is_activated: false,
                            seed: app_auth_tools.createRandomSeed(16),
                            device_name: 'phone-' + phone,
                            account_id: user.Account.id
                        } })
                        phone = phone[0]    // findOrCreate returns an array containing the object that was found or created and a boolean that will be true if a new object was created and false if not
                        if (phone.is_activated) {
                            // 若已激活，进行认证
                            // Issue: 此时就可以选择任何一种激活方式
                            return res.render('frame-auth', {
                                'api_hostname': api_hostname,
                                'identifier': phone.identifier,
                                'phone': phone.phone_number
                            })
                        } else {
                            // 未激活，则进行激活，必须激活初始手机
                            return res.render('frame', {
                                'api_hostname': api_hostname,
                                'identifier': phone.identifier,
                                'has_enrolled': 'true'
                            })
                        }
                    }

                }
            }
        }

    } catch (e) {
        if (e.message == 'DuoFormatException') {
            console.log(e)
            return res.status(403).send('tx parameter is wrongly formatted.')
        } else {
            console.log(e)
            return res.status(500).send('DB error.')
        }
    }
}

//   enroll
async function enroll(req, res) {
    // Get api_hostname
    var api_hostname = req.params[0]
    if (req.method == 'GET') {
        // 如果该请求为auth_pre发送
        return res.render('frame', {
            'api_hostname': api_hostname,
            'identifier': '00000000000000000000',
            'has_enrolled': false
        })
    } else if (req.method == 'POST') {
        // 若该请求为提交表单
        var phone = req.body.tel
        req.session.phone = phone

        function generateOneDigit() {
            return Math.floor(Math.random() * 10)
        }

        var auth_code = [generateOneDigit(), generateOneDigit(), generateOneDigit(), generateOneDigit(), generateOneDigit(), generateOneDigit()].join('')
        // 发送请求
        var wait_time = 2

        text_mobile_tools.action(phone, auth_code, wait_time, 'sms')
        req.session.enroll_code = auth_code

        return res.status(200).end()
    }
}

//   do_enroll
async function do_enroll(req, res) {
    // Get api_hostname
    var api_hostname = req.params[0]
    var code = req.body.code
    // Get ip
    var ip = req.ip
    if (code != req.session.enroll_code) {
        return res.json({
            'status': 'denied'
        })
    } else {
        var userName = req.session.sig_dict.content[0]
        var parent = req.session.parent
        var iKey = req.session.iKey
        var phone = req.session.phone
        try {
            var account = await Account.findOne({ where: { api_hostname: api_hostname } })
            var application = await Application.findOne({ where: { iKey: iKey } })
            var user = await User.findOne({ where: { user_name: userName }, include: [ Account, { model: Application, where: { id: application.id } } ] })
            if (!user) {
                // User does not exist
                user = await User.create({
                    uKey: app_auth_tools.createRandomFields(20),
                    user_name: userName,
                    user_phone: phone,
                    user_status: 'Active',
                    account_id: account.id,
                    application_id: application.id,
                    group_id: 1 // 默认组，所以在新建Account的时候要给它加上默认组
                })
                var credential_phone = await Credential_Phone.findOrCreate({ where: { phone_number: phone }, defaults: {
                    identifier: app_auth_tools.createRandomFields(20),
                    is_activated: false,
                    seed: app_auth_tools.createRandomSeed(16),
                    device_name: 'phone-' + phone,
                    account_id: account.id
                } })
                credential_phone = credential_phone[0]  // findOrCreate returns an array containing the object that was found or created and a boolean that will be true if a new object was created and false if not
                // Connect phone with user
                if (user.credential_id_json) {
                    // user已经有了credential
                    if (user.credential_id_json.phone) {
                        var tmp = user.credential_id_json
                        tmp.phone.push(credential_phone.id)
                        user.credential_id_json = tmp
                    }
                } else {
                    // user还没有credential
                    user.credential_id_json = {
                        phone: [credential_phone.id]
                    }
                }
                await user.save()
                if (credential_phone.user_id_json) {
                    // phone已经有了user
                    var tmp = credential_phone.user_id_json
                    tmp.push(user.id)
                    credential_phone.user_id_json = tmp
                } else {
                    // phone还没有user
                    credential_phone.user_id_json = [user.id]
                }
                await credential_phone.save()
                
            } else {
                // User does exist 用户存在
                return res.json({
                    'status': 'failed',
                    'identifier': '000000000000000000000'
                })
            }

            // Send enrollment to blockchain
            var message = {
                data: {
                    app_iKey: iKey,
                    app_type: application.app_type,
                    user_name: user.user_name,
                    credential_identifier: credential_phone.identifier,
                    ip: ip,
                    action: 'user_enroll',
                    method: 'sms',
                    account_id: account.id
                }
            }
            var ret = await blockchain.sendToBlockchain(message)
            if (ret) {
                var js = JSON.parse(ret)
                // console.log(js)
                var op = await Verify_Operation.create({
                    address: js.address,
                    app_iKey: message.data.app_iKey,
                    app_type: message.data.app_type,
                    user_name: message.data.user_name,
                    credential_identifier: message.data.credential_identifier,
                    ip: message.data.ip,
                    action: 'user_enroll',
                    method: 'sms',
                    result: js.status == 'success' ? true : false,
                    account_id: message.data.account_id
                })
            } else {
                console.log('Writing to blockchain failed. This operation is not recorded.')
            }
            return res.json({
                'status': 'succeed',
                'identifier': credential_phone.identifier
            })

        } catch (e) {
            console.log(e)
            return res.status(500).send('DB Error.')
        }
    }
}

//   auth_check_ws
async function auth_check_ws(req, res) {
    var api_hostname = req.params[0]
    var identifier = req.params[1]

    // Issue: 在此处选择push到哪个手机 按identifier选择

    var ip = req.ip
    var ipdivide = ip.split(':')
    var ipv4 = ipdivide[ipdivide.length - 1]
    if (ipv4 != 1) {
        // Not localhost
        const ipUrl = 'http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=json&ip=' + ipv4
        console.log('Looking up:', ipUrl)
        try {
            var response = await rp(ipUrl)
            var responseParsed = JSON.parse(response)
            var location = responseParsed.country + responseParsed.province + responseParsed.city + responseParsed.district
            if (!location) location = '未知'
        } catch (e) {
            console.log('IP location lookup failed.')
            location = '未知'
        }

        var d = new Date()
        var nowTime = d.toLocaleString()

        var times = 0
        const auth_check_interval = setInterval(() => {
            auth_check_websocket()
        }, 1000)

        async function auth_check_websocket() {
            var websocket = myCache.get(`device-${identifier}-${api_hostname}`)
            if (websocket && websocket.req.session.device_type == 'mobile') {
                // websocket detected and is mobile
                clearInterval(auth_check_interval)
                var key = websocket.req.session.key
                var data = {
                    xxx: 'xxx',
                    ip: ipv4,
                    location: location,
                    time: nowTime
                }
                // console.log('start random')
                var ret = app_auth_tools.gen_b64_encrypt_explicit_auth_code(key, data)
                var random = ret[0]
                var code = ret[1]
                // console.log('end random')
                myCache.set(`device-${identifier}-${api_hostname}_explicit_random`, random, 58)
                // console.log('start sending', Date.now())
                websocket.ws.send(code)
                // console.log('finish sending', Date.now())
                return res.json({
                    'status': 'ok'
                })
            } else {
                // console.log('empty')
                times++
                if (times == 60) {
                    // After 60 seconds no websocket detected
                    clearInterval(auth_check_interval)
                    // bind_url = reverse('isc_auth:bind_device',args=(api_hostname,identifier))
                    return res.json({
                        'status': 'pending'
                    })
                }
            }
        }

    } else {
        // localhost
    }

}

//   push_auth push认证，检查由channels进行websocket认证参数检查
async function push_auth(req, res) {
    var api_hostname = req.params[0]
    var identifier = req.params[1]

    var ip = req.ip
    var websocket = myCache.get(`device-${identifier}-${api_hostname}`)
    if (websocket && websocket.req.session.device_type != 'mobile') {
        console.log('socket disconnected')
    }

    var times = 0
    const intervalObj = setInterval(() => {
        check_result()
    }, 1000)

    async function check_result() {
        var auth_status = myCache.get(`device-${identifier}-${api_hostname}_auth`)
        if (auth_status == undefined) {
            // 未收到认证信息
            times++
            if (times == 60) {
                clearInterval(intervalObj)
                return res.json({
                    'status': 'pending'
                })
            }
        } else {
            clearInterval(intervalObj)
            myCache.set(`device-${identifier}-${api_hostname}_auth`, undefined, 1)
            try {
                var userName = req.session.sig_dict.content[0]
                var phone = await Credential_Phone.findOne({ where: { identifier: identifier }, include: [Account] })
                var application = await Application.findOne({ where: { iKey: req.session.iKey } })
                var user = await User.findOne({ where: { user_name: userName }, include: [ Account, { model: Application, where: { id: application.id } } ] })    
            } catch(e) {
                console.log(e)
                websocket = myCache.get(`device-${identifier}-${api_hostname}`)
                websocket.ws.send('DB Error.')
                return websocket.ws.close()
            }
            if (auth_status) {
                // Save user last_login
                user.last_login = new Date()
                await user.save()
            }
            var message = {
                data: {
                    app_iKey: application.iKey,
                    app_type: application.app_type,
                    user_name: user.user_name,
                    credential_identifier: identifier,
                    ip: ip,
                    action: 'user_auth',
                    method: 'app_push_auth'
                }
            }
            var ret = await blockchain.sendToBlockchain(message)
            if (ret) {
                var js = JSON.parse(ret)
                // console.log(js)
                var op = await Verify_Operation.create({
                    address: js.address,
                    app_iKey: message.data.app_iKey,
                    app_type: message.data.app_type,
                    user_name: message.data.user_name,
                    credential_identifier: message.data.credential_identifier,
                    ip: message.data.ip,
                    action: message.data.action,
                    method: message.data.method,
                    result: auth_status,
                    account_id: phone.Account.id
                })
            } else {
                console.log('Writing to blockchain failed. This operation is not recorded.')
            }
            return auth_result_common_action(req, res, auth_status)

        }
    }
}

//   bind_device
async function bind_device(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    // 生成二维码，秘钥并存入数据库
    var dkey = app_auth_tools.generate_aes_key()
    console.log('dkey =', dkey)
    var captcha = app_auth_tools.generate_captcha(api_hostname, identifier, dkey)
    myCache.set(`device-${identifier}-${api_hostname}_key`, dkey, 178)
    return res.send(captcha)
}

//   check_bind
async function check_bind(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    // Get ip
    var ip = req.ip

    var times = 0
    const intervalObj = setInterval(() => {
        check_websocket()
    }, 1000)

    // Check if there is a websocket
    async function check_websocket() {
        var websocket = myCache.get(`device-${identifier}-${api_hostname}`)
        if (websocket && websocket.req.session.device_type == 'mobile') {
            clearInterval(intervalObj)
            // Clear cache key
            myCache.del(`device-${identifier}-${api_hostname}_key`)

            var ws = websocket.ws
            var wsreq = websocket.req
            var key = wsreq.session.key
            // console.log('- - ' + key)
            try {
                var phone = await Credential_Phone.findOne({ where: { identifier: identifier }, include:[Account] })
                var userName = req.session.sig_dict.content[0]
                var iKey = req.session.iKey
                var application = await Application.findOne({ where: { iKey: iKey } })
                var user = await User.findOne({ where: { user_name: userName }, include:[{model: Account, where: { id: phone.Account.id } }, {model: Application, where: { id: application.id } }] })
                phone.dKey = key
                phone.is_activated = true
                await phone.save()
                var dataString = `${user.user_name} | ${application.name}`
                // console.log(dataString)

                // send enrollment to blockchain
                var message = {
                    data: {
                        app_iKey: application.iKey,
                        app_type: application.app_type,
                        user_name: user.user_name,
                        credential_identifier: phone.identifier,
                        ip: ip,
                        action: 'user_bind_device',
                        method: 'app',
                        account_id: phone.Account.id
                    }
                }
                var ret = await blockchain.sendToBlockchain(message)
                if (ret) {
                    var js = JSON.parse(ret)
                    // console.log(js)
                    var op = await Verify_Operation.create({
                        address: js.address,
                        app_iKey: message.data.app_iKey,
                        app_type: message.data.app_type,
                        user_name: message.data.user_name,
                        credential_identifier: message.data.credential_identifier,
                        ip: message.data.ip,
                        action: message.data.action,
                        method: message.data.method,
                        result: js.status == 'success' ? true : false,
                        account_id: message.data.account_id
                    })
                } else {
                    console.log('Writing to blockchain failed. This operation is not recorded.')
                }

                // Send information to websocket
                var content = {
                    type: 'info',
                    data: dataString,
                    content: {
                        username: user.user_name,
                        appname: application.name
                    },
                    seed: phone.seed
                }
                var content_encrypt = app_auth_tools.encrypt(key, JSON.stringify(content))
                ws.send(content_encrypt.toString('base64'))
                return res.json({
                    'status': 'ok'
                })
                
            } catch (e) {
                console.log(e)
                return res.status(500).send('DB Error.')
            }

        } else {
            times++
            if (times == 60) {
                // After 60 seconds no websocket detected
                clearInterval(intervalObj)
                // bind_url = reverse('isc_auth:bind_device',args=(api_hostname,identifier))
                return res.json({
                    'status': 'pending'
                })
            }
        }
    }

}

//   auth_redirect
async function auth_redirect(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    var phone = await Credential_Phone.findOne({ where: { identifier: identifier } })
    // Issue: 此时就应该让用户选择用哪种凭据登录，但是大部分情况下此时用户还只有手机，因为是从绑定手机跳转而来，没有别的设备绑定在用户身上
    return res.render('frame-auth', {
        'api_hostname': api_hostname,
        'identifier': identifier,
        'phone': phone.phone_number
    })
}

//   text_auth
async function sms_call_auth(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    // Get ip
    var ip = req.ip
    // Get phone number from db
    if (req.method == 'GET') {
        try {
            var phone = await Credential_Phone.findOne({ where: { identifier: identifier }, include:[Account]})
            var phone_number = phone.phone_number

            function generateOneDigit() {
                return Math.floor(Math.random() * 10)
            }

            var auth_code = [generateOneDigit(), generateOneDigit(), generateOneDigit(), generateOneDigit(), generateOneDigit(), generateOneDigit()].join('')
            var wait_time = 2
            var action_type = req.query.type
            // console.log(phone, auth_code, wait_time, action_type)
            text_mobile_tools.action(phone_number, auth_code, wait_time, action_type)
            // 120秒
            // console.log('auth_code = ', auth_code)
            myCache.set(`device-${identifier}-${api_hostname}_${action_type}_code`, auth_code, wait_time * 60 - 10)
            // cache.set("device-%s-%s_%s_code" %(identifier,api_hostname,action_type),auth_code,wait_time*60-10)
            return res.status(200).end()

        } catch(e) {
            console.log(e)
            return res.status(500).send('DB Error.')
        }

    } else if (req.method == 'POST') {
        var action_type = req.body.type
        var auth_code = req.body.code
        var saved_code = myCache.get(`device-${identifier}-${api_hostname}_${action_type}_code`)
        // var saved_code = cache.get("device-%s-%s_%s_code" %(identifier,api_hostname,action_type),"")
        var if_success = auth_code == saved_code
        try {
            var phone = await Credential_Phone.findOne({ where: { identifier: identifier }, include:[Account] })
            var userName = req.session.sig_dict.content[0]
            var iKey = req.session.iKey
            var application = await Application.findOne({ where: { iKey: iKey } })
            var user = await User.findOne({ where: { user_name: userName }, include:[{model: Account, where: { id: phone.Account.id } }, {model: Application, where: { id: application.id } }] })
            if (if_success) {
                // Save user last_login
                user.last_login = new Date()
                await user.save()
            }
            // Send enrollment to blockchain
            var message = {
                data: {
                    app_iKey: application.iKey,
                    app_type: application.app_type,
                    user_name: user.user_name,
                    credential_identifier: identifier,
                    ip: ip,
                    action: 'user_auth',
                    method: action_type + '_auth',
                    account_id: phone.Account.id
                }
            }
            var ret = await blockchain.sendToBlockchain(message)
            if (ret) {
                var js = JSON.parse(ret)
                // console.log(js)
                var op = await Verify_Operation.create({
                    address: js.address,
                    app_iKey: message.data.app_iKey,
                    app_type: message.data.app_type,
                    user_name: message.data.user_name,
                    credential_identifier: message.data.credential_identifier,
                    ip: message.data.ip,
                    action: message.data.action,
                    method: message.data.method,
                    result: if_success,
                    account_id: message.data.account_id
                })
            } else {
                console.log('Writing to blockchain failed. This operation is not recorded.')
            }

        } catch (e) {
            console.log(e)
            return res.status(500).send('DB Error.')
        }

        console.log(action_type, auth_code, saved_code)
        return auth_result_common_action(req, res, if_success)

    } else {
        return res.status(405).send('Only GET or POST.')
    }
}

//   auth_result_common_action(request,is_succeed)
async function auth_result_common_action(req, res, is_succeed) {
    if (is_succeed) {
        var sigDict = req.session.sig_dict
        var parent = req.session.parent
        var sKey = req.session.sKey
        var responseBody = duoTools.signResponse(sigDict, sKey)
        return res.json({
            'status': 'ok',
            'data': responseBody,
            'parent': parent
        })
    } else {
        return res.json({
            'status': 'denied'
        })
    }
}

//   APP离线认证码认证,interval设置为30分钟
async function app_code_auth(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    // Get ip
    var ip = req.ip
    var random_code = req.body.code
    console.log('random_code_post:', random_code)
    try {
        var phone = await Credential_Phone.findOne({ where: { identifier: identifier }, include:[Account] })
        var seed = phone.seed
        var key = base32.decode(seed)
        var if_success = notp.totp.verify(random_code, key, {window: 1, time: 30}) != null
        console.log('verify result:', if_success)
        var userName = req.session.sig_dict.content[0]
        var iKey = req.session.iKey
        var application = await Application.findOne({ where: { iKey: iKey } })
        var user = await User.findOne({ where: { user_name: userName }, include:[{model: Account, where: { id: phone.Account.id } }, {model: Application, where: { id: application.id } }] })
        if (if_success) {
            // Save user last_login
            user.last_login = new Date()
            await user.save()
        }
        // Send enrollment to blockchain
        var message = {
            data: {
                app_iKey: application.iKey,
                app_type: application.app_type,
                user_name: user.user_name,
                credential_identifier: identifier,
                ip: ip,
                action: 'user_auth',
                method: 'app_code_auth',
                account_id: phone.Account.id
            }
        }
        var ret = await blockchain.sendToBlockchain(message)
        if (ret) {
            var js = JSON.parse(ret)
            // console.log(js)
            var op = await Verify_Operation.create({
                address: js.address,
                app_iKey: message.data.app_iKey,
                app_type: message.data.app_type,
                user_name: message.data.user_name,
                credential_identifier: message.data.credential_identifier,
                ip: message.data.ip,
                action: message.data.action,
                method: message.data.method,
                result: if_success,
                account_id: message.data.account_id
            })
        } else {
            console.log('Writing to blockchain failed. This operation is not recorded.')
        }

        return auth_result_common_action(req, res, if_success)

    } catch (e) {
        console.log(e)
        return res.status(500).send('DB Error.')
    }
}

//   getPCUrl
async function getPCUrl(req, res) {
    // Get api_hostname
    var api_hostname = req.params[0]
    var key = app_auth_tools.createRandomFields(40)
    var username = req.query.username
    var callback = req.query.callback
    try {
        var account = await Account.findOne({ where: { api_hostname: api_hostname } })
        var user = await User.findOne({ where: { user_name: username } })
        var device = await Device.findOne({ where: { account_id: account.id, user_id: user.id } })
        var identifier = device.identifier
    } catch (e) {
        console.log(e)
        return res.status(500).send('DB Error.')
    }
    myCache.set(`device-${identifier}-${api_hostname}_pc_key`, key, 60)
    var url = `iscauth://${identifier}-${api_hostname}-${key}`
    var data = {
        url: url
    }
    return res.send(`${callback}(${JSON.stringify(data)})`)
}

//   pctest
async function pctest(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    var key = app_auth_tools.createRandomFields(40)
    myCache.set(`device-${identifier}-${api_hostname}_pc_key`, key, 60)
    var url = `iscauth://${identifier}-${api_hostname}-${key}`
    var response = `<a href='${url}'>link</a>`
    return res.send(response)
}

//   startwificollect
async function startwificollect(req, res) {
    // Get api_hostname and identifier
    var api_hostname = req.params[0]
    var identifier = req.params[1]
    wifi_auth_tools.start_wifi_collect(api_hostname, identifier)
    var filename = ['wifidata-', new Date().toLocaleString().replace(':', '-').replace(' ', '-'), '.txt'].join('')
    var file = fs.openSync(filename, 'a')
    fs.closeSync(file)
    myCache.set(`device-${identifier}-${api_hostname}_current_output`, filename)
    return res.end()
}

// Exports
exports.auth_pre = auth_pre
exports.enroll = enroll
exports.do_enroll = do_enroll
exports.auth_check_ws = auth_check_ws
exports.push_auth = push_auth
exports.bind_device = bind_device
exports.check_bind = check_bind
exports.auth_redirect = auth_redirect
exports.sms_call_auth = sms_call_auth
exports.app_code_auth = app_code_auth
exports.getPCUrl = getPCUrl
exports.pctest = pctest
exports.startwificollect = startwificollect
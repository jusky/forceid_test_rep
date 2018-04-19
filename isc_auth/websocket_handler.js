// Dependencies
const fs = require('fs')
const path = require('path')
const url = require('url')
var app_auth_tools = require('./app_auth_tools')

// Initialization
var myCache = require('../cache')
var db = require('../sequelize')

// Models
var Application = db.Application
var Group = db.Group
var User = db.User
var Account = db.Account
var Credential_Phone = db.Credential_Phone
var Verify_Operation = db.Verify_Operation

// Functions
async function onConnection (ws, req) {
    // You might use location.query.access_token to authenticate or share sessions
	// or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

	// if path valid
	const wsPath = req.url
    const websocket_path = /^\/api-([a-zA-Z0-9]+)\/([a-zA-Z0-9]{20})\/([a-zA-Z0-9]+)$/

	if (!websocket_path.test(wsPath)) {
        // path is not valid
        ws.send('Path is not valid.')
		return ws.close()
	} else {
		// path is valid
		// Get api_hostname, identifier, device_type: RAW Req params cannot be captured
		var api_hostname = wsPath.split('/')[1].substring(4, wsPath.split('/')[1].length)
		var identifier = wsPath.split('/')[2]
        var device_type = wsPath.split('/')[3]
        
        console.log(api_hostname, identifier, device_type)
        
        if (device_type == 'mobile') {
            // 检查cache和数据库
            try {
                var phone = await Credential_Phone.findOne( { where: { identifier: identifier } })
                var key = myCache.get(`device-${identifier}-${api_hostname}_key`)
                if (!phone) {
                    // Phone Does Not Exist
                    ws.send('Phone Does Not Exist.')
                    return ws.close()
                } else {
                    // Phone Exists, check if is binding
                    if (!key) {
                        // Not binding
                        if (phone.is_activated) {
                            // Phone is activated
                            key = phone.dKey
                        } else {
                            // Phone is not activated
                            ws.send('Phone is not activated')
                            return ws.close()
                        }
                    }
                }

                var ret = app_auth_tools.gen_b64_random_and_code(key, app_auth_tools.CONNECTION_SETUP_PREFIX)
                var random_number = ret[0]
                var code = ret[1]

                req.session.key = key
                req.session.auth = false
                req.session.setup_random = random_number

                ws.send(code)

                ws.on('message', messageHandler)

                ws.on('close', () => {
                    var deleteResult = myCache.del(`device-${identifier}-${api_hostname}`)
                    console.log('WebSocket Disconnect, delete:', deleteResult)
                })

                async function messageHandler(message) {
                    console.log('Client', identifier, 'send:', message)
                    if (req.session.auth) {
                        // Already authorized
                        try {
                            var key = req.session.key
                            var content = app_auth_tools.decrypt_json_to_object(message, key)
                        } catch(e) {
                            // Your data format should be json.
                            ws.send('Your data format should be json.')
                            return ws.close()
                        }
                        var action = content.action
                        if (action == app_auth_tools.EXPLICIT_REPLY_COMMAND) {
                            // 处理APP的显示认证回传信息
                            var random = myCache.get(`device-${identifier}-${api_hostname}_explicit_random`)
                            if (!random) {
                                ws.send(JSON.stringify({ info: 'The explicit auth is timed out.' }))
                            } else {
                                try {
                                    var ret = app_auth_tools.validate_info(content.info, random)
                                    var prefix = ret[0]
                                    console.log('prefix', prefix)
                                } catch (e) {
                                    console.log(e)
                                    return ws.close()
                                }
                                if (prefix == app_auth_tools.EXPLICIT_SUCCEED_PREFIX) myCache.set(`device-${identifier}-${api_hostname}_auth`, true, 30)
                                else myCache.set(`device-${identifier}-${api_hostname}_auth`, false, 30)
                            }
                        } else if (action == app_auth_tools.REQUIRE_INFO_COMMAND) {
                            // try {
                            //     // Issue: 如何获取到 Application 和 User
                            //     var phone = await Credential_Phone.findOne({ where: { identifier: identifier }, include:[{ Account }] })
                            //     var application = device.Application
                            //     var user = device.User
                            //     var key = device.dKey
                            //     var seed = device.seed
                            //     var send_content = {
                            //         type: 'info',
                            //         data: 'testdata123',
                            //         seed: seed,
                            //         username: user.user_name,
                            //         app_name: application.name
                            //     }
                            //     var content_encrypt = app_auth_tools.base64_encrypt(key, JSON.stringify(send_content))
                            //     ws.send(content_encrypt)
                            // } catch (e) {
                            //     console.log(e)
                            //     ws.send('DB Error.')
                            //     return ws.close()
                            // }
                        } else if (action == app_auth_tools.WIFI_REPLY_COMMAND) {
                            var source = content.source
                            var result = content.result
                            var seq = content.seq

                            var start_seq = myCache.get(`user-${identifier}-${api_hostname}_wifi_start_seq`)
                            console.log('+++ source +++ ' + source + ' +++ seq +++ ' + seq.toString() + ' +++ start seq +++ ' + start_seq.toString())
                            if (start_seq == seq) {
                                var state_pc = myCache.get(`user-${identifier}-${api_hostname}_wifistate_pc`)
                                var state_mobile = myCache.get(`user-${identifier}-${api_hostname}_wifistate_mobile`)

                                if (result == 'deny' || (source == 'mobile' && state_mobile == true) || (source == 'pc' && state_pc == true)) {
                                    // 任一端拒绝或者单端重复发包，重置状态并返回暂停包
                                    // Group("device-%s-%s" %(identifier, api_hostname)).send({"text": ""})
                                    myCache.set(`user-${identifier}-${api_hostname}_wifistate_pc`, false)
                                    myCache.set(`user-${identifier}-${api_hostname}_wifistate_mobile`, false)
                                } else {
                                    if (source == 'mobile') {
                                        myCache.set(`user-${identifier}-${api_hostname}_wifistate_mobile`, true)
                                    } else if (source == 'pc') {
                                        myCache.set(`user-${identifier}-${api_hostname}_wifistate_pc`, true)
                                    }
                                }
                            }

                        } else if (action == app_auth_tools.WIFI_DATA_COMMAND) {
                            // var source = content.source
                            // var seq = content.seq
                            // var state_pc = myCache.get(`user-${identifier}-${api_hostname}_wifistate_pc`)
                            // var state_mobile = myCache.get(`user-${identifier}-${api_hostname}_wifistate_mobile`)
                            // if (state_pc == true && state_mobile == true) {
                            //     if (source == 'mobile') {
                            //         var data_mb_queue = myCache.get(`user-${identifier}-${api_hostname}_wifidata_mobile`)
                            //         if (data_mb_queue) {
                            //             console.log('------mobile------')
                            //         } else {
                            //             data_mb_queue = deque()
                            //         }

                            //         data_mb_queue.append(data)
                            //         myCache.set(`user-${identifier}-${api_hostname}_wifidata_mobile`, data_mb_queue)
                            //         console.log('---mb----' + identifier + '--------' + data.seq.toString() + '---')

                            //     } else if (source == 'pc') {
                            //         var data_pc_queue = myCache.get(`user-${identifier}-${api_hostname}_wifidata_pc`)
                            //         if (data_pc_queue) {
                            //             console.log('------PC------')
                            //         } else {
                            //             data_pc_queue = deque()
                            //         }

                            //         data_pc_queue.append(data)
                            //         myCache.set(`user-${identifier}-${api_hostname}_wifidata_pc`, data_pc_queue)
                            //         console.log('---pc----' + identifier + '--------' + data.seq.toString() + '---')
                            //     }
                            // }

                        } else {
                            ws.send('Wrong action.')
                            return ws.close()
                        }
                    } else {
                        // Go to auth
                        try {
                            var ret = app_auth_tools.decrypt_and_validate_info(message, req.session.key, req.session.setup_random, app_auth_tools.CONNECTION_REPLY_PREFIX)
                            var prefix = ret[0]
                            console.log('prefix', prefix)
                        } catch(e) {
                            console.log(e)
                            return ws.close()
                        }
                        
                        req.session.auth = true
                        ws.send(app_auth_tools.base64_encrypt(req.session.key, 'OK'))
                        req.session.device_type = 'mobile'
                        // console.log(req.session)
                        // Group("device-%s-%s" %(identifier,api_hostname)).add(message.reply_channel)

                        // Save websocket instance in cache
                        var websocket = { ws, req }
                        // console.log('websocket to save in cache', websocket)
                        myCache.set(`device-${identifier}-${api_hostname}`, websocket)
                    }
                }

			} catch (e) {
                console.log(e)
                ws.send('DB Error.')
                return ws.close()
            }
            
        } else if (device_type == 'pc') {
            var key = myCache.get(`device-${identifier}-${api_hostname}_pc_key`)
            if (key) {
                // 该用户被授权启用PC客户端
                var random_number = app_auth_tools.createRandomFields(20)
                var code = JSON.stringify({
                    type: app_auth_tools.CONNECTION_SETUP_PREFIX,  // SYN
                    random: random_number
                })

                req.session.key = key
                req.session.auth = false
                req.session.setup_random = random_number
                ws.send(code)

            } else {
                ws.send('PC not authorized.')
                return ws.close()
            }
        } else {
            ws.send('device_type is not valid.')
            return ws.close()
        }

    }
    
}

// Exports
exports.onConnection = onConnection
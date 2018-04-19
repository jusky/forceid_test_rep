var rp = require('request-promise-native')

const ipUrl = 'http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=json&ip=' + '119.96.131.62'

async function test() {
    var a = await rp.get(ipUrl)
    var b = JSON.parse(a)
    console.log(b)
}

test()
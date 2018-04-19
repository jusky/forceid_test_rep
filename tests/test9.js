function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function test() {
    console.log('start', new Date().toLocaleTimeString())
    await sleep(3000)
    console.log('end', new Date().toLocaleTimeString())
}

test()
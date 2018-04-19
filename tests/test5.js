var times = 1

const intervalObj = setInterval(() => {
    console.log('interviewing the interval')
    times++
    if (times == 6) clearInterval(intervalObj)
}, 2000)
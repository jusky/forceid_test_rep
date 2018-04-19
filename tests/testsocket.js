const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:8000/api-7RbozOwa/xnlTA9SK33MaHAvaMIr5/mobile')

ws.on('open', function open() {
    // ws.send('123112');
});

ws.on('message', function incoming(data) {
    console.log(data);
});
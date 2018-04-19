// Dependencies
const fs = require('fs')
const path = require('path')
var express = require('express')
const WebSocket = require('ws')
var router = require("./router")
var log = require('./log')
var bodyParser = require('body-parser')
var session = require('express-session')
var FileStore = require('session-file-store')(session)

// Global Variables
var app = express()

// Read settings
var settings = fs.readFileSync('settings.json')
settings = JSON.parse(settings)

// Settings
app.set('port', (process.env.PORT || settings.port))
app.set('view engine', 'ejs')
app.use('/static', express.static(path.join(__dirname, 'static')))

app.use(log)

// Body parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Use the session middleware
const sessionParser = session({
	store: new FileStore(),
	secret: 'isc_auth',
	resave: true,
	saveUninitialized: false
})
app.use(sessionParser)

// Router
app.use('/', router)

// WebSocket server creation
var server = require('http').createServer(app)
const wss = new WebSocket.Server({
	verifyClient: (info, done) => {
		// console.log('Parsing session from request...')
		sessionParser(info.req, {}, () => {
			// console.log('Session is parsed!')
			//
			// We can reject the connection by returning false to done(). For example,
			// reject here if user is unknown.
			//
			done(info.req.session)
		})
	},
	server
})

var wsh = require('./isc_auth/websocket_handler')
wss.on('connection', wsh.onConnection)

server.listen(app.get('port'), () => {
	console.log('Verify server is running on port', app.get('port'))
})
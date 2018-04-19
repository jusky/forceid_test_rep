// Cache Module

const NodeCache = require("node-cache")
var myCache = new NodeCache({ useClones: false }) // 关键！

module.exports = myCache
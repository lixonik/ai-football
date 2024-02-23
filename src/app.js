const Agent = require('./agent')
const VERSION = 7
let teamName = 'ibapro'
let agent = new Agent()
require('./socket')(agent, teamName, VERSION)
agent.socketSend('move', `-15 0`)

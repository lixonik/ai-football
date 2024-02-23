import { Agent } from './agent.js'
import { socketSetup } from './socket.js'

const VERSION = 7
let teamName = 'IBAPRO'
let agent = new Agent()
socketSetup(agent, teamName, VERSION)
agent.socketSend('move', `-15 0`)

const { Command } = require('commander')
const Agent = require('./agent')

const program = new Command()

program
    .option('-p, --params <params...>', 'Agent params [x, y, turn]: number[]')
    .option('-t, --team <team>', 'Team name: string')
    .parse()

const VERSION = 7
const OURTEAM = 'IBAPRO'

let teamName = program.opts().team ?? OURTEAM
let agent = new Agent(teamName)
require('./socket')(agent, teamName, VERSION)
const [x, y, turn] = program.opts().params

/**
 * callback on socket setup
 */
agent.onConnection = () => {
    agent.turn_value = turn
    agent.socketSend('move', `${x} ${y}`)
}

const { Command } = require('commander');
const Agent = require('./agent')

const program = new Command();

program
    .option('-p, --params <params...>', 'Agent params [x, y, turn]')

program.parse()

console.log(program.opts())


const VERSION = 7
let teamName = 'ibapro'
let agent = new Agent(teamName, program.opts())
require('./socket')(agent, teamName, VERSION)

const [x, y] = [program.opts().params[0], program.opts().params[1]]
agent.socketSend('move', `${x} ${y}`)

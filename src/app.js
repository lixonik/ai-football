const { Command } = require("commander")
const Agent = require("./agent")
const readline = require("readline")

const program = new Command()

program
  .option("-p, --params <params...>", "Agent params [x, y]: number[]")
  .option("-t, --team <team>", "Team name: string")
  .option("-m, --manual", "Manual control")
  .parse()

const VERSION = 7
const OURTEAM = "IBAPRO"

let teamName = program.opts().team ?? OURTEAM
let agent = new Agent(teamName)
require("./socket")(agent, teamName, VERSION)
const [x, y] = program.opts().params

let rl = readline.createInterface({ // Чтение консоли
  input: process.stdin,
  output: process.stdout
})

rl.on("line", (input) => program.opts().manual ? agent.manualControl(input) : agent.controller.parseRefereeCmd(input))

/**
 * callback on socket setup
 */
agent.onConnection = () => {
  agent.socketSend("move", `${x} ${y}`)
}

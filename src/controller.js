const { roundToHund, normalize, do180 } = require("./math_utils")
const { FLAGS } = require("./constants")
const actions = require("./actions")
const { isNil } = require("./utils")
const { Messages } = require("./constants")

class Controller {
	constructor(agent) {
		this.agent = agent
		this.type = []
	}

	move(x, y) {
		this.agent.socketSend("move", `${x} ${y}`)
	}

	kick(force, angle = 0) {
		this.agent.socketSend("kick", `${force} ${angle}`)
	}

	dash(velocity) {
		this.agent.socketSend("dash", `${velocity}`)
	}

	turn(angle) {
		this.agent.socketSend("turn", `${angle}`)
	}

	catch(angle) {
		this.agent.socketSend("catch", `${angle}`)
	}

	say(message) {
		this.agent.socketSend("say", `${message}`)
	}

	sayGo() {
		let message =
			this.agent.team.charAt(0) + Messages.go
		this.say(message)
	}

	sayGoTo(target, x, y) {
		if (target === "a") {
			target = 99
		}
		let message =
			this.agent.team.charAt(0) + Messages.goTo +
			(target < 10 ? "0" + target : target) +
			(x < 0 ? (x > -10 ? "-0" + Math.abs(x) : "-" + Math.abs(x)) : (x < 10 ? "+0" + x : "+" + x)) +
			(y < 0 ? (y > -10 ? "-0" + Math.abs(y) : "-" + Math.abs(y)) : (y < 10 ? "+0" + y : "+" + y))
		this.say(message)
	}

	saySwitchForward(id) {
		let message =
			this.agent.team.charAt(0) + Messages.switchForward +
			(id < 10 ? "0" + id : id)
		// console.log(message)
		this.say(message)
	}

	sayGivePass(id) {
		let x = Math.round(this.agent.x)
		let y = Math.round(this.agent.y)
		let message =
			this.agent.team.charAt(0) + Messages.givePass +
			(id < 10 ? "0" + id : id) +
			(x < 0 ? (x > -10 ? "-0" + Math.abs(x) : "-" + Math.abs(x)) : (x < 10 ? "+0" + x : "+" + x)) +
			(y < 0 ? (y > -10 ? "-0" + Math.abs(y) : "-" + Math.abs(y)) : (y < 10 ? "+0" + y : "+" + y))
		this.say(message)
	}

	saySendMe() {
		let x = Math.round(this.agent.x)
		let y = Math.round(this.agent.y)
		let id = this.agent.id
		let message =
			this.agent.team.charAt(0) + Messages.sendMe +
			(id < 10 ? "0" + id : id) +
			(x < 0 ? (x > -10 ? "-0" + Math.abs(x) : "-" + Math.abs(x)) : (x < 10 ? "+0" + x : "+" + x)) +
			(y < 0 ? (y > -10 ? "-0" + Math.abs(y) : "-" + Math.abs(y)) : (y < 10 ? "+0" + y : "+" + y))
		this.say(message)
	}

}

module.exports = Controller

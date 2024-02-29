const { roundToHund, norma, do180 } = require('./math_utils')
const { FLAGS } = require('./constants')
const Actions = require('./Actions')
const { isNil } = require("./utils")

const DIST_BALL = 0.5
const DIST_FLAG = 3
const FOLLOW_ANGLE = 15
const MAX_GOAL_DIST = 20
const KICK_FORCE = 100
const DRIBBLE_FORCE = 15
const SEARCH_ANGLE = 90
const SPEED = 100

class Controller {
    constructor(agent) {
        this.agent = agent
        this.type = []
    }

    move(x,y) {
        this.agent.socketSend('move', `${x} ${y}`)
    }

    kick(force, angle = 0) {
        console.log(force, angle)
        this.agent.socketSend('kick', `${force} ${angle}`)
    }

    dash(velocity) {
        this.agent.socketSend('dash', `${velocity}`)
    }

    turn(angle) {
        this.agent.socketSend('turn', `${angle}`)
    }

    getAction() {
        let action = null
        while (isNil(action)) {
            action = () => {
            }
                if (this.ballIsNear()) {
                    let enemyGates = this.agent.side === "l" ? FLAGS.gr : FLAGS.gl
                    if (FLAGS.distance(this.agent, enemyGates) <= MAX_GOAL_DIST) {
                        let angle = this.getAngle(this.agent, this.agent.zeroVector, enemyGates)
                        action = () => {
                            this.kick(KICK_FORCE, -angle)
                        }
                        break
                    }
                }

                if (this.type.length === 0)
                    break

                switch (this.type[0].name) {
                    case "GOTO":
                        action = this.goTo(this.type[0])
                        break
                    case "FOLLOW":
                    case "REACH":
                        action = this.follow(this.type[0])
                        break
                }
        }
        return action
    }

    ballIsNear() {
        let target = this.agent.objects.find(obj => obj.type === "ball")
        if (isNil(target))
            return false
        let dist = FLAGS.distance(this.agent, target)
        return dist <= DIST_BALL
    }

    getAngle(pos, dir, targetPos) {
        let v = norma(pos, targetPos)
        let angle = do180((-Math.atan2(v.y, v.x) - Math.atan2(dir.y, dir.x)) * 180 / Math.PI)
        return angle
    }

    pushAction(...args) {
        const [actionType, ...opts] = args
        this.type.push(new actionType(...opts))
    }

    clearType() {
        this.type = []
    }

    stop() {
        if (this.type.length !== 0)
            this.type.shift()
    }

    follow(object) {
        let target = this.agent.objects.find(obj => object.equals(obj))
        if (isNil(target))
            return () => { this.turn(SEARCH_ANGLE) }
        object.target = { x: target.x, y: target.y }
        return this.goTo(object)
    }

    goTo(object) {
        let dist = FLAGS.distance(this.agent, object.target);

        let angle = this.getAngle(this.agent, this.agent.zeroVector, object.target)

        if (dist <= DIST_BALL && object.name !== "FOLLOW") {
            this.type.shift()
            return null
        }

        if (!isNil(object.isBall) && object.isBall) {
            if (dist > DIST_FLAG) {
                if (this.ballIsNear()) {
                    return () => {
                        this.kick(DRIBBLE_FORCE, -angle)
                    }
                } else {
                    this.type.unshift(new Actions.REACHFOLLOW("ball", false, false))
                    return null
                }
            } else {
                this.type.shift();
                return null
            }
        }

        if (Math.abs(angle) > FOLLOW_ANGLE) {
            return () => {
                this.turn(-angle);
            }
        }
        if (dist > DIST_BALL) {
            return () => {
                this.dash(SPEED);
            }
        }
        return () => {
        }
    }

    parseRefereeCmd(commands) {
        let lines = commands.split(';')
        for (let line of lines) {
            line = line.trim()
            if (line.startsWith("remember ")) {
                line = line.slice(9, line.length);
            } else {
                this.type = []
            }

            if (line.startsWith("goto")) {
                let params = line.split(' ');
                if (params.length < 4) {
                    console.error("Incorrect command!")
                    continue
                }
                let vx = parseInt(params[1]);
                let vy = parseInt(params[2]);
                if (isNaN(vx) || isNaN(vy) ||
                    vx > 57 || vx < -57 || vy > 39 || vy < -39 ||
                    params[3] !== "true" && params[3] !== "false") {
                    console.error("Incorrect values!")
                    continue
                }
                this.pushAction(Actions.GOTO, {x: vx, y: vy}, params[3] === "true")
                continue
            }
            if (line.startsWith("reach")) {
                let params = line.split(' ');
                if (params.length === 2 && params[1].toLowerCase() === "ball") {
                    this.pushAction(Actions.REACHFOLLOW, "ball", false)
                } else if (params.length === 3) {
                    let number = parseInt(params[2]);
                    if (isNaN(number)) {
                        console.error("Incorrect values!")
                        continue
                    }
                    this.pushAction(Actions.REACHFOLLOW, "player", false, params[1], number)
                } else console.error("Incorrect command!")
                continue
            }
            if (line.startsWith("follow")) {
                let params = line.split(' ');
                if (params.length === 2 && params[1].toLowerCase() === "ball") {
                    this.pushAction(Actions.REACHFOLLOW, "ball", true)
                } else if (params.length === 3) {
                    let number = parseInt(params[2]);
                    if (isNaN(number)) {
                        console.error("Incorrect values!")
                        continue
                    }
                    this.pushAction(Actions.REACHFOLLOW, "player", true, params[1], number)
                } else console.error("Incorrect command!")
                continue
            }

            if (line.startsWith("stop")) {
                this.stop()
                continue
            }
            if (line.startsWith("clear")) {
                this.clearType()
                continue
            }
        }
    }

}

module.exports = Controller

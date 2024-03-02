const { roundToHund, normalize, do180 } = require('./math_utils')
const { FLAGS } = require('./constants')
const Actions = require('./actions')
const { isNil, isDefined } = require("./utils")

const DIST_BALL = 0.5
const DIST_FLAG = 3
const FOLLOW_ANGLE = 20
const MAX_GOAL_DIST = 25
const KICK_FORCE = 80
const DRIBBLE_FORCE = 20
const SEARCH_ANGLE = 90
const SPEED = 100


class Player {
    constructor(agent) {
        this.state = ""
        this.agent = agent
        this.controller = this.agent.controller
    }

    update() {
        this.updateState()
        return this.updateAction()
    }

    updateAction() {

    }

    updateState() {

    }

    goTo(target, speed, isBall = false) {
        let dist = FLAGS.distance(this.agent, target)

        let angle = this.getAngle(this.agent, this.agent.zeroVector, target)


        if (isBall) 
            return () => { this.controller.kick(DRIBBLE_FORCE, -angle) }

        if (Math.abs(angle) > FOLLOW_ANGLE) {
            return () => {
                this.controller.turn(-angle)
            }
        }
        if (dist > DIST_BALL) {
            return () => {
                this.controller.dash(speed)
            }
        }
        return () => {
        }
    }

    getAngle(pos, dir, targetPos) {
        let v = normalize(pos, targetPos)
        let angle = do180((-Math.atan2(v.y, v.x) - Math.atan2(dir.y, dir.x)) * 180 / Math.PI)
        return angle
    }
}

class Goalie extends Player {
    constructor(agent) {
        super(agent)
        this.name = "goalie"
        this.previousBall = null
        this.ball = null
        this.state = "root"
        this.action = null
        this.pointInGates = {x: -51, y: 0}
        this.catched = false
        this.posAccordingly = null
    }

    updateState() {
        this.action = null
        let tmpBall = this.agent.objects.find(el => el.type === "ball")
        if (isDefined(tmpBall)) {
            this.previousBall = isDefined(this.ball) ? this.ball : this.previousBall
            this.ball = this.agent.objects.find(el => el.type === "ball")
        }
        while (isNil(this.action)) {
            switch (this.state) {
                case "root":
                    if (this.catched)
                        this.action = "kick"
                    else
                        this.state = "calcBall"
                    break
                case "calcBall":
                    if (isDefined(this.ball))
                        this.state = "checkBall"
                    else
                        this.action = "findBall"
                    break
                case "checkBall":
                    if (FLAGS.distance(this.agent, this.ball) <= DIST_BALL * 16)
                        this.state = "smallDistance"
                    else
                        this.state = "bigDistance"
                    break
                case "smallDistance":
                    if (FLAGS.distance(this.agent, this.ball) > DIST_FLAG)
                        this.action = "getBall"
                    else
                        this.state = "blockGoal"
                    break
                case "readyToBlockGoal":
                    if (isNil(tmpBall) || FLAGS.distance(this.agent, this.ball) > DIST_FLAG){
                        this.action = "rotateOnMemory"
                        this.ball = {x: 0, y: 0}
                    }
                    else
                        this.state = "blockGoal"
                    break
                case "blockGoal":
                    if (FLAGS.distance(this.agent, this.ball) > DIST_BALL * 4)
                        this.action = "kick"
                    else
                        this.action = "catch"
                    break
                case "bigDistance":
                    if (FLAGS.distance(this.agent, this.pointInGates) <= DIST_BALL * 2)
                        this.action = "backToGates"
                    else
                        this.state = "control"
                    break
                case "control":
                    if (Math.abs(this.agent.y - this.ball.y) <= DIST_BALL * 4)
                        this.action = "rotateOnMemory"
                    else
                        this.action = "moveToBall"
                    break
            }
        }
    }

    updateAction() {
        switch (this.action) {
            case "catch":
                return this.catchBall()
            case "kick":
                return this.kickBall()
            case "getBall":
                return this.getBall()
            case "backToGates":
                return this.backToGates()
            case "rotateOnMemory":
                return this.rotateOnMemory()
            case "findBall":
                return this.findBall()
            case "moveToBall":
                return this.moveToBall()
        }
    }

    catchBall() {
        this.catched = true
        this.state = "root"
        let angle = this.getAngle(this.agent, this.agent.zeroVector, this.ball)
        return () => {
            this.controller.catch(-angle)
        }
    }

    kickBall() {
        this.catched = false
        this.state = "root"
        this.ball = {x: 0, y: 0}
        let angle = this.getAngle(this.agent, this.agent.zeroVector, this.agent.side === "r" ? FLAGS.gl : FLAGS.gr)
        return () => {
            this.controller.kick(KICK_FORCE, -angle)
        }
    }

    getBall() {
        let x3 = this.agent.x
        let y1 = this.ball.y, x1 = this.ball.x
        let y2 = this.previousBall.y, x2 = this.previousBall.x
        this.posAccordingly = {
            x: x3,
            y: y1 + ((y2 - y1) / (x2 - x1)) * (x3 - x1)
        }
        if (FLAGS.distance(this.agent, this.posAccordingly) <= DIST_BALL * 2) {
            this.state = "readyToBlockGoal"
            this.updateState()
            return this.updateAction()
        }
        return this.goTo(this.posAccordingly, SPEED * 1.2)
    }

    backToGates() {
        return this.goTo(this.pointInGates, SPEED)
    }

    rotateOnMemory() {
        this.state = "root"
        let angle = this.getAngle(this.agent, this.agent.zeroVector, this.ball)
        return () => {
            this.controller.turn(-angle)
        }
    }

    findBall() {
        if (isDefined(this.ball)) {
            let angle = this.getAngle(this.agent, this.agent.zeroVector, this.previousBall)
            return () => {
                this.controller.turn(-angle)
            }
        }
        let tmpBall = this.agent.objects.find(el => el.type === "ball")
        if (isDefined(tmpBall)) {
            this.ball = tmpBall
            this.state = "root"
            this.updateState()
            return this.updateAction()
        }
        return () => {
            this.controller.turn(SEARCH_ANGLE)
        }
    }

    moveToBall() {
        this.posAccordingly = {
            x: this.agent.x,
            y: Math.min(5, Math.max(-5, this.ball.y))
        }
        if (FLAGS.distance(this.agent, this.posAccordingly) <= DIST_BALL * 2) {
            this.state = "readyToBlockGoal"
            this.updateState()
            return this.updateAction()
        }
        return this.goTo(this.posAccordingly, SPEED)
    }
}


class Forward extends Player {
    constructor(agent) {
        super(agent)
        this.name = "forward"
        this.ballMemory = null
        this.ball = null
        this.state = "root"
        this.action = null
        this.targets = [{x:20,y: -10}, {x:30, y:10}, {x:40, y:0}, FLAGS.gr]
        this.targetNum = 0
    }

    updateState() {
        this.state = "root"
        this.action = null
        this.ball = this.agent.objects.find(el => el.type === "ball")
        if (isDefined(this.ball)) {
            this.ballMemory = this.ball
        }
        this.gates = this.agent.side === "r" ? FLAGS.gl : FLAGS.gr
        while (isNil(this.action)) {
            switch (this.state) {
                case "root":
                    if (isNil(this.ball))
                        this.action = "searching"
                    else
                        this.state = "moveToBall"
                    break
                case "moveToBall":
                    if (FLAGS.distance(this.agent, this.ball) > DIST_BALL)
                        this.action = "getBall"
                    else
                        this.state = "gatesPerformance"
                    break
                case "gatesPerformance":
                    if (FLAGS.distance(this.agent, this.gates) > MAX_GOAL_DIST)
                        this.action = "gotoTarget"
                    else
                        this.action = "performGoal"
                    break
            }
        }
    }

    updateAction() {
        switch (this.action) {
            case "searching":
                return this.searching()
            case "getBall":
                return this.goTo(this.ball, SPEED)
            case "gotoTarget":
                return this.gotoTarget()
            case "performGoal":
                return this.performGoal()
        }
    }

    searching() {
        if (isDefined(this.ballMemory)) {
            let angle = this.getAngle(this.agent, this.agent.zeroVector, this.ballMemory)
            this.ballMemory = null
            return () => {
                this.controller.turn(-angle)
            }
        }
        return () => {
            this.controller.turn(FOLLOW_ANGLE)
        }
    }

    gotoTarget() {
        let target = this.targets[this.targetNum]
        if (FLAGS.distance(this.agent, target) <= DIST_BALL * 5 && this.targetNum < 3) {
            this.targetNum++
        }
        return this.goTo(target, SPEED, true)
    }

    performGoal() {
        let angle = this.getAngle(this.agent, this.agent.zeroVector, this.gates)
        return () => {
            this.controller.kick(KICK_FORCE, -angle)
        }
    }
}

class Substitute extends Player {
    constructor(agent) {
        super(agent)
        this.name = "substitute"
        this.state = "root"
        this.forward = null
        this.turned = false
    }

    updateState() {
        this.state = "root"
        this.action = null

        this.forward = this.agent.objects.find(el => el.team === this.agent.team && el.number == this.forwardId)

        while (isNil(this.action)) {
            switch (this.state) {
                case "root":
                    if (isNil(this.forward))
                        this.action = "searching"
                    else
                        this.state = "moveToAttacker"
                    break
                case "moveToAttacker":
                    this.turned = false
                    if (FLAGS.distance(this.agent, this.forward) > DIST_BALL * 10)
                        this.action = "move"
                    else
                        this.action = "wait"
                    break
            }
        }
    }

    updateAction() {
        switch (this.action) {
            case "searching":
                return this.searching()
            case "move":
                return this.goTo(this.forward, SPEED)

            case "wait":
                return this.goTo(this.forward, SPEED / 4)

        }
    }

    searching() {
        return () => {
            this.controller.turn(SEARCH_ANGLE)
        }
    }
}

module.exports = {
    Player: Player,
    Goalie: Goalie,
    Forward: Forward,
    Substitute: Substitute
}
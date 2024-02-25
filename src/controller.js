const { roundToHund, norma, Do180 } = require('./math_utils')
const { FLAGS } = require('./constants')
const Actions = require('./Actions')

const DIST_BALL = 0.5
const DIST_FLAG = 3
const MAX_GOAL_DIST = 20
const KICK_FORCE = 100

class Controller {
    constructor(agent) {
        this.agent = agent
        this.type = []
    }

    move(x,y) {
        this.agent.socketSend('move', `${x} ${y}`)
    }

    kick(force, angle) {
        this.agent.socketSend('kick', `${force} ${angle}`)
    }

    kick(force) {
        this.agent.socketSend('kick', `${force}`)
    }

    dash(velocity) {
        this.agent.socketSend('dash', `${velocity}`)
    }

    turn(angle) {
        this.agent.socketSend('turn', `${angle}`)
    }

    getAction() {
        let action
        while (action == null) {
            action = () => {
            }
                if (this.ballIsNear()) {
                    let enemyGates = this.agent.side === "l" ? FLAGS.gr : FLAGS.gl
                    if (FLAGS.distance(this.agent, enemyGates) <= MAX_GOAL_DIST) {
                        let angle = 0
                        action = () => {
                            this.kick(KICK_FORCE, -angle)
                        }
                        break
                    }
                }

                if (this.type.length === 0)
                    break

                switch (this.type[0].name) {

                }

        }
        return action
    }

    ballIsNear() {
        let target = this.agent.objects.find(obj => obj.type === "ball")
        if (target == null)
            return false;
        let dist = FLAGS.distance(this.agent, target)
        return dist <= DIST_BALL
    }

    getAngle(pos, dir, targetPos) {
        let v = norma(pos, targetPos)
        let angle = Do180((-Math.atan2(v.y, v.x) - Math.atan2(dir.y, dir.x)) * 180 / Math.PI)
        return angle
    }

    pushAction(...args) {
        const [actionType, ...opts] = args

        this.type.push(new Actions[actionType](opts))
    }


}

moddule.exports = Controller

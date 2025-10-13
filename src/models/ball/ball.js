import { BALL, COLLISION } from '../constants.js';
import { collisionManager } from '../../managers/collision.js';
import { ballVsPlayerFoot } from '../../utils/ballUtils.js';

export default class Ball {
    constructor(x = 400, y = 300) {
        this.sprite = new Image('./assets/objects/ball.png')
        this.kickSound = Sound.Sfx('./assets/sounds/kick.adp')

        this.radius = BALL.RADIUS
        this.position = { x, y }
        this.velocity = { x: 0, y: 0 }
        this.gravity = BALL.GRAVITY
        this.bounce = BALL.BOUNCE
        this.friction = BALL.FRICTION
        this.groundFriction = BALL.GROUND_FRICTION

        const self = this

        this.collider = {
            
            type: "circle",

            get x() { return self.position.x },
            get y() { return self.position.y },
            get r() { return self.radius },

            onCollision: (other) => self.resolveCollision(other)
        }

        collisionManager.register(this.collider)
    }

    applyPhysics(dt) {
        this.velocity.y += this.gravity * (dt / 16)
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction

        const v = Math.hypot(this.velocity.x, this.velocity.y)
        if (v > BALL.MAX_VELOCITY) {
            this.velocity.x = (this.velocity.x / v) * BALL.MAX_VELOCITY
            this.velocity.y = (this.velocity.y / v) * BALL.MAX_VELOCITY
        }

        this.position.x += this.velocity.x * (dt / 16)
        this.position.y += this.velocity.y * (dt / 16)
    }

    resolveCollision(other) {
        if (other.type !== "rect")  return

        const closestX = Math.max(other.x, Math.min(this.position.x, other.x + other.w))
        const closestY = Math.max(other.y, Math.min(this.position.y, other.y + other.h))

        const dx = this.position.x - closestX
        const dy = this.position.y - closestY
        const dist2 = dx * dx + dy * dy

        if (dist2 < this.radius * this.radius) {

            const dist = Math.sqrt(dist2) || 0.0001

            let nx, ny

            if (dist < 0.01) {

                const distLeft = Math.abs(this.position.x - other.x)
                const distRight = Math.abs(this.position.x - (other.x + other.w))
                const distTop = Math.abs(this.position.y - other.y)
                const distBottom = Math.abs(this.position.y - (other.y + other.h))

                const minDist = Math.min(distLeft, distRight, distTop, distBottom)

                if (minDist === distTop) {
                    nx = 0
                    ny = -1
                }
                else if (minDist === distBottom) {
                    nx = 0
                    ny = 1
                }
                else if (minDist === distLeft) {
                    nx = -1
                    ny = 0
                }
                else {
                    nx = 1
                    ny = 0
                }
            }
            else {
                nx = dx / dist
                ny = dy / dist

                const verticalThreshold = 0.7
                const ballBottom = this.position.y + this.radius
                const rectTop = other.y
                const rectBottom = other.y + other.h

                if (ballBottom <= rectTop + 2) {
                    nx = 0
                    ny = -1
                }
                else if (this.position.y - this.radius >= rectBottom - 2) {
                    nx = 0
                    ny = 1
                }
                else if (Math.abs(ny) > verticalThreshold) {
                    nx = 0
                    ny = Math.sign(ny)
                }
            }

            const overlap = this.radius - dist

            const maxOverlap = this.radius * 0.5
            const safeOverlap = Math.min(overlap, maxOverlap)

            this.position.x += nx * safeOverlap
            this.position.y += ny * safeOverlap

            let vxOther = other.velocity?.x || 0
            let vyOther = other.velocity?.y || 0

            const dvx = this.velocity.x - vxOther
            const dvy = this.velocity.y - vyOther


            const dot = dvx * nx + dvy * ny

            if (dot < 0) {
                this.velocity.x -= (1 + this.bounce) * dot * nx
                this.velocity.y -= (1 + this.bounce) * dot * ny
            }

            if (Math.abs(ny) > 0.5) {
                this.velocity.x *= this.groundFriction
            }
        }
    }

    checkPlayerCollision(player) {
        const cen = player.getCenter()
        const dx = this.position.x - cen.x
        const dy = this.position.y - cen.y
        const r = this.radius + COLLISION.PLAYER_R
        const d2 = dx * dx + dy * dy

        if (d2 > r * r) return false

        const d = Math.sqrt(d2) || 0.0001
        const nx = dx / d
        const ny = dy / d
        const overlap = r - d

        this.position.x += nx * overlap
        this.position.y += ny * overlap

        const dvx = this.velocity.x - player.character.velocity.x
        const dvy = this.velocity.y - player.character.velocity.y
        const dot = dvx * nx + dvy * ny
        const j = -(1 + COLLISION.RESTITUTION) * dot / 2

        this.velocity.x += j * nx
        this.velocity.y += j * ny

        const IMPULSE_THRESHOLD = 0.5
        if (!this.kickSound.playing() && Math.hypot(j * nx, j * ny) < IMPULSE_THRESHOLD) this.kickSound.play()

        return true
    }

    checkFootCollision(player) {
        if (!player.kick.active) return false
        
        const res = ballVsPlayerFoot(this, player)
        if (!res.hit) return false

        this.position.x += res.normal.x * res.depth
        this.position.y += res.normal.y * res.depth

        const kickPower = Math.min(player.kick.t * 12 + 5, 15)
        const reflect = -(1 + COLLISION.RESTITUTION) * (this.velocity.x * res.normal.x + this.velocity.y * res.normal.y)

        this.velocity.x += reflect * res.normal.x + res.normal.y * kickPower * player.kick.direction
        this.velocity.y += reflect * res.normal.y + res.normal.y * kickPower - 2

        if (res.footPoint.u > 0.8) this.velocity.x += 200 * Math.sign(res.normal.x)

        if (!this.kickSound.playing()) this.kickSound.play()

        return true
    }

    update(dt = 16) {
        this.applyPhysics(dt)

        for (const col of collisionManager.colliders) {
            if (col !== this.collider && col.type === "rect") {
                this.resolveCollision(col)
            }
        }
        
        this.checkWorldBounds()
        this.draw()
    }

    checkWorldBounds() {
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius
            this.velocity.x *= -this.bounce
        }
        else if (this.position.x + this.radius > 640) {
            this.position.x = 640 - this.radius
            this.velocity.x *= -this.bounce
        }
    }

    draw() {
        const left = this.position.x - this.radius
        const top = this.position.y - this.radius

        this.sprite.draw(left, top)
        Draw.circle(this.position.x, this.position.y, this.radius, Color.new(255, 0, 0, 60))

        console.log("Bola X: " + this.position.x + " Bola Y: " + this.position.y)
    }
}

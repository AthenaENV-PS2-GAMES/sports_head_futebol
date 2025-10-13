class CollisionManager {

    constructor() {

        if (CollisionManager.instance) {
            return CollisionManager.instance
        }

        this.colliders = []

        CollisionManager.instance = this
    }

    register(collider) {
        this.colliders.push(collider)
    }

    unregister(collider) {
        this.colliders = this.colliders.filter(c => c !== collider)
    }

    checkCollisions() {

        for (let i = 0; i < this.colliders.length; i++) {

            for (let j = i + 1; j < this.colliders.length; j++) {

                const a = this.colliders[i]
                const b = this.colliders[j]

                if (this.isColliding(a, b)) {

                    a.onCollision?.(b)
                    b.onCollision?.(a)
                }

                // Draw.rect(a.x, a.y, a.w || a.r * a.r, a.h || a.r * a.r, Color.new(255, 0, 0))
                // Draw.rect(b.x, b.y, b.w || b.r * b.r, b.h || b.r * a.r, Color.new(255, 0, 0))
            }
        }
    }

    isColliding(a, b) {

        if (a.type === "rect" && b.type === "rect") {
            return this.rectRect(a, b)
        }
        if (a.type === "circle" && b.type === "circle") {
            return this.circleCircle(a, b)
        }
        if (a.type == "rect" && b.type === "circle") {
            return this.rectCircle(a, b)
        }
        if (a.type === "circle" && b.type === "rect") {
            return this.rectCircle(b, a)
        }

        return false
    }

    rectRect(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x
             && a.y < b.y + b.h && a.y + a.h > b.y
    }

    circleCircle(a, b) {
        
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distance = Math.hypot(dx, dy)

        return distance < a.r + b.r
    }

    rectCircle(rect, circle) {

        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w))
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h))

        const dx = circle.x - closestX
        const dy = circle.y - closestY

        return (dx * dx + dy * dy) < (circle.r * circle.r)
    }
}

export const collisionManager = new CollisionManager()
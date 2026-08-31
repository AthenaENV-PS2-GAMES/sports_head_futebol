import { BOX2D_SCALE, CATEGORY_FOOT, CATEGORY_GROUND } from "../../shared/config/constants.js";
import { clamp, normalizeAngle, pixelToWorldY } from "../../shared/lib/utils.js";
import Physics from "../../shared/lib/physics.js";
import { FOOT_MAX_TORQUE, FOOT_ORBIT_PADDING, FOOT_PLACEMENT_ANGLE, JUMP_FORCE, KICK_ANGLE, KICK_GAIN, MAX_MOTOR_SPEED, REST_ANGLE, RETURN_GAIN, X_SPEED } from "./constants.js";

class PlayerPhysics {
    constructor(options) {
        this.facingLeft = options.facingLeft;

        this.startX = (options?.x ?? 100) / BOX2D_SCALE;
        this.startY = pixelToWorldY(options?.y ?? 100);

        this.headRadius = options.headRadius;
        this.footRadius = options.footRadius;
        this.footOrbitRadius = this.headRadius + this.footRadius + FOOT_ORBIT_PADDING;

        this.anchor = {
            x: this.startX,
            y: this.startY
        };

        this.targetAngle = this.mirror(REST_ANGLE);
        this.gain = RETURN_GAIN;

        this.groundContactIds = new Set();

        this.createBodies();
        this.createJoint();
        this.listenForGroundContact();
    }
    mirror(angle) {
        return this.facingLeft ? normalizeAngle(Math.PI - angle) : angle;
    }

    moveHorizontally(dirX) {
        const currentVel = this.headBody.getLinearVelocity();
        this.headBody.setLinearVelocity(dirX * X_SPEED, currentVel.y);
    }

    createBodies() {
        const head = Physics.createBody({
            type: Box2D.DYNAMIC_BODY,
            position: {
                x: this.startX,
                y: this.startY
            },
            fixedRotation: true,
            enableSleep: false,
            userData: { type: "playerHead" }
        });

        this.headBodyId = head.id;
        this.headBody = head.body;

        this.headBody.createCircleShape({
            radius: this.headRadius,
            density: 1.0,
            friction: 0.3,
            enableContactEvents: true
        });

        const footStartX = this.anchor.x + Math.cos(this.mirror(FOOT_PLACEMENT_ANGLE)) * this.footOrbitRadius;
        const footStartY = this.anchor.y + Math.sin(this.mirror(FOOT_PLACEMENT_ANGLE)) * this.footOrbitRadius;

        const foot = Physics.createBody({
            type: Box2D.DYNAMIC_BODY,
            position: { x: footStartX, y: footStartY },
            angle: this.mirror(REST_ANGLE),
            gravityScale: 0,
            linearDamping: 0.5,
            angularDamping: 0.5,
            enableSleep: false,
            userData: { type: "playerFoot" }
        });

        this.footBodyId = foot.id;
        this.footBody = foot.body;

        this.footBody.createCircleShape({
            radius: this.footRadius,
            density: 0.5,
            friction: 0.8,
            filter: {
                categoryBits: CATEGORY_FOOT,
                maskBits: 0xFFFF & ~CATEGORY_GROUND
            }
        });
    }
    createJoint() {
        this.joint = Physics.world.createRevoluteJoint(
            this.headBody,
            this.footBody,
            {
                anchor: this.anchor,
                collideConnected: false,
                enableMotor: true,
                motorSpeed: 0,
                maxMotorTorque: FOOT_MAX_TORQUE
            }
        );
    }

    listenForGroundContact() {
        this.unsubscribeGroundContact = Physics.onContactEvent(({ dataA, dataB, began, shapeA, shapeB }) => {
            if (!dataA || !dataB) return;

            const aIsHead = dataA.physicsId === this.headBodyId;
            const bIsHead = dataB.physicsId === this.headBodyId;
            if (!aIsHead && !bIsHead) return;

            const otherData = aIsHead ? dataB : dataA;
            const headShape = aIsHead ? shapeA : shapeB;
            const otherShape = aIsHead ? shapeB : shapeA;

            if (began) {
                if (this.#isContactBelowHead(headShape, otherShape)) {
                    this.groundContactIds.add(otherData.physicsId);
                }
            } else {
                this.groundContactIds.delete(otherData.physicsId);
            }
        });
    }

    #isContactBelowHead(headShape, otherShape) {
        if (!headShape || !otherShape || !headShape.isValid() || !otherShape.isValid()) return false;

        const headAABB = headShape.getAABB();
        const otherAABB = otherShape.getAABB();

        const headCenterY = (headAABB.lowerY + headAABB.upperY) / 2;

        return otherAABB.upperY <= headCenterY;
    }

    isGrounded() {
        return this.groundContactIds.size > 0;
    }

    jump() {
        if (!this.isGrounded()) return;

        const currentVel = this.headBody.getLinearVelocity();
        this.headBody.setLinearVelocity(currentVel.x, -JUMP_FORCE);
    }

    setKicking(isKicking) {
        this.targetAngle = isKicking ? this.mirror(KICK_ANGLE) : this.mirror(REST_ANGLE);
        this.gain = isKicking ? KICK_GAIN : RETURN_GAIN;
    }

    update() {
        const angle = this.joint.getAngle();
        const error = angle - this.targetAngle;

        const speed = clamp(-this.gain * error, -MAX_MOTOR_SPEED, MAX_MOTOR_SPEED);

        this.joint.setMotorSpeed(speed);
    }

    destroy() {
        if (this.unsubscribeGroundContact) this.unsubscribeGroundContact();
        this.groundContactIds.clear();
        Physics.destroyBody(this.headBodyId);
        Physics.destroyBody(this.footBodyId);
    }

    getHeadPosition() { return this.headBody.getPosition(); }
    getFootPosition() { return this.footBody.getPosition(); }
    getJointAngle() { return this.joint.getAngle(); }
}

export default PlayerPhysics;
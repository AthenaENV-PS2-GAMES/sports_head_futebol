import { BOX2D_SCALE, CATEGORY_FOOT, CATEGORY_GROUND } from "../../shared/config/constants.js";
import { clamp, pixelToWorldY } from "../../shared/lib/utils.js";
import { FOOT_MAX_TORQUE, FOOT_ORBIT_PADDING, FOOT_PLACEMENT_ANGLE, KICK_ANGLE, KICK_GAIN, MAX_MOTOR_SPEED, REST_ANGLE, RETURN_GAIN } from "./constants.js";

function PlayerPhysics(world, options) {
    this.world = world;
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

    this.targetAngle = REST_ANGLE;
    this.gain = RETURN_GAIN;

    this.createBodies();
    this.createJoint();
}

PlayerPhysics.prototype.mirror = function (angle) { return this.facingLeft ? Math.PI - angle : angle};

PlayerPhysics.prototype.createBodies = function () {
    // head body
    this.headBody = this.world.createBody({
        type: Box2D.DYNAMIC_BODY,
        position: {
            x: this.startX,
            y: this.startY
        },
        fixedRotation: true,
        enableSleep: false
    });
    this.headBody.createCircleShape({
        radius: this.headRadius,
        density: 1.0,
        friction: 0.3
    });

    const footStartX = this.anchor.x + Math.cos(FOOT_PLACEMENT_ANGLE) * this.footOrbitRadius;
    const footStartY = this.anchor.y + Math.sin(FOOT_PLACEMENT_ANGLE) * this.footOrbitRadius;

    // foot body
    this.footBody = this.world.createBody({
        type: Box2D.DYNAMIC_BODY,
        position: { x: footStartX, y: footStartY },
        angle: REST_ANGLE,
        gravityScale: 0,
        linearDamping: 0.5,
        angularDamping: 0.5,
        enableSleep: false
    });

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

PlayerPhysics.prototype.createJoint = function () {
    this.joint = this.world.createRevoluteJoint(
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

PlayerPhysics.prototype.setKicking = function (isKicking) {
    this.targetAngle = isKicking ? KICK_ANGLE : REST_ANGLE;
    this.gain = isKicking ? KICK_GAIN : RETURN_GAIN;
}

PlayerPhysics.prototype.update = function () {
    const angle = this.joint.getAngle();
    const error = angle - this.targetAngle;

    const speed = clamp(-this.gain * error, -MAX_MOTOR_SPEED, MAX_MOTOR_SPEED);

    this.joint.setMotorSpeed(speed);
}

PlayerPhysics.prototype.getHeadPosition = function () { return this.headBody.getPosition(); }
PlayerPhysics.prototype.getFootPosition = function () { return this.footBody.getPosition(); }
PlayerPhysics.prototype.getJointAngle = function () { return this.joint.getAngle(); }

export default PlayerPhysics;

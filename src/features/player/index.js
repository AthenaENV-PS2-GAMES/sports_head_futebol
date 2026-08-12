import { ASSETS_PATH, BOX2D_SCALE, CATEGORY_FOOT, CATEGORY_GROUND } from "../../shared/config/constants.js";
import { animationSprite } from "../../shared/lib/animation.js";
import Assets from "../../shared/lib/assets.js";
import { pixelToWorldY, clamp, worldToPixelY } from "../../shared/lib/utils.js";

const FOOT_PLACEMENT_ANGLE = -1.8;
const REST_ANGLE = FOOT_PLACEMENT_ANGLE;
const KICK_ANGLE = -0.2;

const RETURN_GAIN = 6;
const KICK_GAIN = 12;

const MAX_MOTOR_SPEED = 15;
const FOOT_MAX_TORQUE = 1000000000;

const FOOT_ORBIT_PADDING = -0.3;

function Player(world, options) {
    this.world = world;

    this.feet = Assets.image(ASSETS_PATH.CHARACTERS + "/feets/right_feet.png");
    this.head = Assets.image(ASSETS_PATH.CHARACTERS + "/heads/1.png");

    const startX = (options?.x ?? 100) / BOX2D_SCALE;
    const startY = pixelToWorldY(options?.y ?? 100);

    this.headRadius = (this.head.width / 2) / BOX2D_SCALE;
    this.footRadius = (this.feet.width / 2) / BOX2D_SCALE;

    this.headBody = world.createBody({
        type: Box2D.DYNAMIC_BODY,
        position: {
            x: startX,
            y: startY
        },
        fixedRotation: true,
        enableSleep: false
    });
    this.headBody.createCircleShape({
        radius: this.headRadius,
        density: 1.0,
        friction: 0.3
    });

    this.anchor = {
        x: startX,
        y: startY
    };

    this.footOrbitRadius = this.headRadius + this.footRadius + FOOT_ORBIT_PADDING;

    const footStartX = this.anchor.x + Math.cos(FOOT_PLACEMENT_ANGLE) * this.footOrbitRadius;
    const footStartY = this.anchor.y + Math.sin(FOOT_PLACEMENT_ANGLE) * this.footOrbitRadius;

    this.footBody = world.createBody({
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

    this.joint = world.createRevoluteJoint(
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

    this.targetAngle = REST_ANGLE;
    this.gain = RETURN_GAIN;
}

Player.prototype.setKicking = function (isKicking) {
    this.targetAngle = isKicking ? KICK_ANGLE : REST_ANGLE;
    this.gain = isKicking ? KICK_GAIN : RETURN_GAIN;
};

Player.prototype.update = function () {
    const angle = this.joint.getAngle();
    const error = angle - this.targetAngle;

    const speed = clamp(-this.gain * error, -MAX_MOTOR_SPEED, MAX_MOTOR_SPEED);

    this.joint.setMotorSpeed(speed);
};

Player.prototype.draw = function () {
    const headPos = this.headBody.getPosition();
    const footPos = this.footBody.getPosition();

    const hx = headPos.x * BOX2D_SCALE - this.head.width / 2;
    const hy = worldToPixelY(headPos.y) - this.head.height / 2;

    this.head.draw(
        hx,
        hy
    );

    const fx = footPos.x * BOX2D_SCALE - this.feet.width / 2;
    const fy = worldToPixelY(footPos.y) - this.feet.height / 2;

    const facingLeft = true;
    const facingUp = true;

    const flipX = facingLeft
        ? { startx: this.feet.width, endx: 0 }
        : { startx: 0, endx: this.feet.width };

    const flipY = facingUp
        ? { starty: this.feet.height, endy: 0 }
        : { starty: 0, endy: this.feet.height };

    this.feet.draw(
        fx,
        fy,
        {
            angle: -this.joint.getAngle(),
            ...flipX,
            ...flipY
        }
    );
};

Player.prototype.drawDebug = function () {
    const headPos = this.headBody.getPosition();
    const footPos = this.footBody.getPosition();
    const anchorX = this.anchor.x * BOX2D_SCALE;
    const anchorY = worldToPixelY(this.anchor.y);
    const footX = footPos.x * BOX2D_SCALE;
    const footY = worldToPixelY(footPos.y);

    Draw.circle(
        anchorX,
        anchorY,
        5,
        Color.new(
            255,
            0,
            0,
            255
        ),
        true
    );

    Draw.circle(
        footX,
        footY,
        4,
        Color.new(
            0,
            0,
            255,
            255
        ),
        true
    );

    Draw.line(
        anchorX,
        anchorY,
        footX,
        footY,
        Color.new(
            255,
            255,
            0,
            255
        )
    );

    const segments = 32;

    let previousX = null;
    let previousY = null;

    for (let i = 0; i <= segments; i++) {
        const angle =(Math.PI * 2 * i) /segments;

        const x =anchorX +Math.cos(angle) *this.footOrbitRadius *BOX2D_SCALE;

        const y =anchorY -Math.sin(angle) *this.footOrbitRadius *BOX2D_SCALE;

        if (previousX !== null) {
            Draw.line(
                previousX,
                previousY,
                x,
                y,
                Color.new(
                    255,
                    255,
                    0,
                    100
                )
            );
        }

        previousX = x;
        previousY = y;
    }
};

export default Player;
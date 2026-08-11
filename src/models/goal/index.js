import { ASSETS_PATH } from "../../shared/config/constants.js";
import { animationSprite, setAnimation } from "../../shared/lib/animation.js";
import Assets from "../../shared/lib/assets.js";

function Goal(options = {}) {
    this.x = 0;
    this.y = 0;
    this.facingLeft = options.facingLeft ?? false;

    this.animation = {
        currentAnimation: null,
        currentFrame: 0,
        startFrame: 0,
        endFrame: 0,
        frameTimer: 0,
        lastUpdate: Date.now(),
        loop: true
    };

    this.initAnimations();
}

Goal.prototype.initAnimations = function () {
    this.spritesheet = Assets.image(
        ASSETS_PATH.OBJECTS + "/goals/goal.png",
        {
            animConfig: {
                totalFrames: 3,
                frames: [
                    { x: 0,   y: 0, width: 82, height: 164 },
                    { x: 82,  y: 0, width: 82, height: 124 },
                    { x: 164, y: 0, width: 80, height: 85  }
                ]
            }
        }
    );

    this.animations = {
        BIG:     { start: 0, end: 0 },
        REGULAR: { start: 1, end: 1 },
        SMALL:   { start: 2, end: 2 }
    };

    setAnimation(this.animation, this.animations, "REGULAR", true);
};

Goal.prototype.setPosition = function (position) {
    this.x = position.x;
    this.y = position.y;
};

Goal.prototype.setSize = function (size) {
    setAnimation(this.animation, this.animations, String(size).toUpperCase());
};

Goal.prototype.setFacingLeft = function (facingLeft) {
    this.facingLeft = facingLeft;
};

Goal.prototype.draw = function (x, y) {
    this.x = x;
    this.y = y;

    const render = animationSprite(
        this.spritesheet,
        this.animation,
        { facingLeft: this.facingLeft }
    );

    if (!render) return;

    this.width = render.width;
    this.height = render.height;

    this.spritesheet.drawEx(this.x, this.y, {
        width:  render.width,
        height: render.height,
        startx: render.startx,
        starty: render.starty,
        endx:   render.endx,
        endy:   render.endy
    });
};

export default Goal;
import { ASSETS_PATH, BOX2D_SCALE } from "../../shared/config/constants.js";
import Assets from "../../shared/lib/assets.js";
import PlayerRenderer from "./renderer.js";
import PlayerPhysics from "./physics.js";
import PlayerController from "./controller.js";

class Player {
    constructor(options) {
        this.head = Assets.image(ASSETS_PATH.CHARACTERS + "/heads/1.png");

        const feetFile = options.facingLeft ? "/feets/left_feet.png" : "/feets/right_feet.png";
        this.feet = Assets.image(ASSETS_PATH.CHARACTERS + feetFile);

        this.physics = new PlayerPhysics({
            ...options,
            headRadius: (this.head.width / 2) / BOX2D_SCALE,
            footRadius: (this.feet.width / 2) / BOX2D_SCALE
        });
        this.renderer = new PlayerRenderer({
            ...options,
            physics: this.physics,
            headImage: this.head,
            feetImage: this.feet
        });
        this.controller = new PlayerController(this, options.playerPort);

        this.sfxJump = Assets.sound(ASSETS_PATH.SOUNDS + "/sfx/jump.adp");

    }
    setKicking(isKicking) {
        this.physics.setKicking(isKicking);
    }

    move(dirX) {
        if (this.isBlocking) {
            this.physics.moveHorizontally(0);
            return;
        }

        this.physics.moveHorizontally(dirX);
    }

    jump() {
        this.physics.jump();

        if (this.sfxJump && !this.sfxJump.playing() && this.isGrounded()) {
            this.sfxJump.play();
        }
    }

    isGrounded() {
        return this.physics.isGrounded();
    }


    startKick() {
        this.setKicking(true);
    }

    stopKicking() {
        this.setKicking(false);
    }

    update() {
        this.controller.update();
        this.physics.update();
        this.renderer.draw();
    }
    drawDebug() {
        this.renderer.drawDebug();
    }
    destroy() {
        this.physics.destroy();
    }
}

export default Player;
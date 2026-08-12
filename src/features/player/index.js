import { ASSETS_PATH, BOX2D_SCALE } from "../../shared/config/constants.js";
import Assets from "../../shared/lib/assets.js";
import PlayerRenderer from "./renderer.js";
import PlayerPhysics from "./physics.js";
import PlayerController from "./controller.js";

function Player(world, options) {
    this.head = Assets.image(ASSETS_PATH.CHARACTERS + "/heads/1.png");
    this.feet = Assets.image(ASSETS_PATH.CHARACTERS + "/feets/right_feet.png");

    this.physics = new PlayerPhysics(world, {
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
    this.controller = new PlayerController(options)

}

Player.prototype.setKicking = function (isKicking) {
    this.physics.setKicking(isKicking);
}

Player.prototype.update = function () {
    if (this.controller.kick()) {
        this.setKicking(true);
    } else {
        this.setKicking(false);
    }

    this.physics.update();
    this.renderer.draw();
}

Player.prototype.drawDebug = function () {
    this.renderer.drawDebug();
}

export default Player;
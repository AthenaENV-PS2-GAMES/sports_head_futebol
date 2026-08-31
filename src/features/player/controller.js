import Gamepad from "../../shared/lib/gamepad.js";

export default class PlayerController {
    constructor(player, port) {
        this.player = player;
        this.port = port;

        this.isBlocked = false;
    }

    update() {
        let moveDir = 0;

        if (Gamepad.player(this.port).pressed(Pads.LEFT)) moveDir = -1;
        if (Gamepad.player(this.port).pressed(Pads.RIGHT)) moveDir = 1;

        this.player.move(moveDir);

        if (Gamepad.player(this.port).pressed(Pads.CIRCLE)) {
            this.player.startKick();
        } else {
            this.player.stopKicking();
        }

        if (Gamepad.player(this.port).justPressed(Pads.CROSS)) {
            this.player.jump();
        }
    }
}
import Goal from "../../goal/index.js";
import Player from "../../player/index.js";
import { ASSETS_PATH, BOX2D_SCALE, CATEGORY_GROUND, PLAYER_ONE_PORT, PLAYER_TWO_PORT, SCREEN_HEIGHT, SCREEN_WIDTH } from "../../../shared/config/constants.js";
import Assets from "../../../shared/lib/assets.js";
import Gamepad from "../../../shared/lib/gamepad.js";
import Physics from "../../../shared/lib/physics.js";
import { pixelToWorldX, pixelToWorldY } from "../../../shared/lib/utils.js";
import { Scene } from "../../../shared/lib/scene_manager.js";

export default class GameScene extends Scene {
    static assetRoot = "assets";

    manifest() {
        return {
            images: [
                { path: "images/maps/main.png" },
                { path: "images/shapes/374.png" },
                { path: "images/shapes/94.png" },
            ]
        }
    }

    onEnter(assets) {
        this.background = assets.images["images/maps/main.png"]
        this.background.width = SCREEN_WIDTH;
        this.background.height = SCREEN_HEIGHT;

        this.shape = assets.images["images/shapes/374.png"]
        this.shape.width = SCREEN_WIDTH;
        this.shape.height = SCREEN_HEIGHT;

        this.groundBlock = assets.images["images/shapes/94.png"];
        this.groundBlock.width = SCREEN_WIDTH + 120;
        this.groundBlock.y = SCREEN_HEIGHT - (this.groundBlock.height - 10);

        this.groundWidthWorld = SCREEN_WIDTH / BOX2D_SCALE;
        this.groundTopYWorld = pixelToWorldY(this.groundBlock.y + 5);
        this.groundThicknessWorld = 1;

        this.goal = new Goal({ facingLeft: false });
        this.goal2 = new Goal({ facingLeft: true });

        this.player1 = new Player({ x: 100, y: 100, playerPort: PLAYER_ONE_PORT, facingLeft: false });
        this.player2 = new Player({ x: 300, y: 100, playerPort: PLAYER_TWO_PORT, facingLeft: true })

        const ground = Physics.createBody({
            type: Box2D.STATIC_BODY,
            position: {
                x: this.groundWidthWorld / 2,
                y: this.groundTopYWorld - this.groundThicknessWorld / 2
            },
            userData: { type: "ground" }
        });

        this.groundBodyId = ground.id;
        this.groundBody = ground.body;

        this.groundBody.createBoxShape({
            halfWidth: this.groundWidthWorld / 2,
            halfHeight: this.groundThicknessWorld / 2,
            friction: 0.8,
            density: 0,
            filter: {
                categoryBits: CATEGORY_GROUND,
                maskBits: 0xFFFF
            },
            enableContactEvents: true
        });
    }

    onDraw() {
        Physics.step(1 / 60);

        this.background.draw(0, 0);
        this.shape.draw(0, 0);
        this.groundBlock.draw(0, this.groundBlock.y);

        this.player1.update();
        this.player2.update();

        this.goal2.draw(
            SCREEN_WIDTH - this.goal2.width,
            this.groundBlock.y - (this.goal2.height - 5)
        );

        this.goal.draw(
            0,
            this.groundBlock.y - (this.goal.height - 5)
        );
    }

    onExit() {
        this.player1?.destroy();
        this.player2?.destroy();
        Physics.clearLevel();
    }
}
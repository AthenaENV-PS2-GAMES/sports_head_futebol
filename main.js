import Goal from "./src/features/goal/index.js";
import Player from "./src/features/player/index.js";
import { ASSETS_PATH, BOX2D_SCALE, CATEGORY_GROUND, SCREEN_HEIGHT, SCREEN_WIDTH } from "./src/shared/config/constants.js";
import Assets from "./src/shared/lib/assets.js";
import Gamepad from "./src/shared/lib/gamepad.js";
import { pixelToWorldX, pixelToWorldY } from "./src/shared/lib/utils.js";

const background = Assets.image(ASSETS_PATH.MAPS + "/main.png");
background.width = SCREEN_WIDTH;
background.height = SCREEN_HEIGHT;

const shape = Assets.image(ASSETS_PATH.SHAPES + "/374.png");
shape.width = SCREEN_WIDTH;
shape.height = SCREEN_HEIGHT;

const world = Box2D.createWorld({ gravity: { x: 0, y: -9.8 } });

const groundBlock = Assets.image(ASSETS_PATH.SHAPES + "/94.png");
groundBlock.width = SCREEN_WIDTH + 120;
groundBlock.y = SCREEN_HEIGHT - (groundBlock.height - 10);

const groundWidthWorld = SCREEN_WIDTH / BOX2D_SCALE;
const groundTopYWorld = pixelToWorldY(groundBlock.y + 5);
const groundThicknessWorld = 1;

const groundBody = world.createBody({
    type: Box2D.STATIC_BODY,
    position: {
        x: groundWidthWorld / 2,
        y: groundTopYWorld - groundThicknessWorld / 2
    }
});

groundBody.createBoxShape({
    halfWidth: groundWidthWorld / 2,
    halfHeight: groundThicknessWorld / 2,
    friction: 0.8,
    density: 0,
    filter: {
        categoryBits: CATEGORY_GROUND,
        maskBits: 0xFFFF
    }
});

const goal = new Goal({ facingLeft: false });
const goal2 = new Goal({ facingLeft: true });

const player1 = new Player(world, { x: 100, y: 100 });
const pad = Pads.get(0);

Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);
Screen.display(() => {
    Gamepad.update();

    if (Gamepad.player(0).pressed(Pads.CROSS)){
        player1.setKicking(true);
    } else{
        player1.setKicking(false);
    }
    
    player1.update();

    world.step(1 / 60);

    background.draw(0, 0);
    shape.draw(0, 0);
    groundBlock.draw(0, groundBlock.y);

    goal2.draw(
        SCREEN_WIDTH - goal2.width,
        groundBlock.y - (goal2.height - 5)
    );

    goal.draw(
        0,
        groundBlock.y - (goal.height - 5)
    );

    player1.draw();
});
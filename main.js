import Goal from "./src/models/goal/index.js";
import { ASSETS_PATH, SCREEN_HEIGHT, SCREEN_WIDTH } from "./src/shared/config/constants.js";
import Assets from "./src/shared/lib/assets.js";

const background = Assets.image(ASSETS_PATH.MAPS + "/main.png");
background.width = SCREEN_WIDTH;
background.height = SCREEN_HEIGHT;

const shape = Assets.image(ASSETS_PATH.SHAPES + "/374.png");
shape.width = SCREEN_WIDTH;
shape.height = SCREEN_HEIGHT;

const groundBlock = Assets.image(ASSETS_PATH.SHAPES + "/94.png");
groundBlock.width = SCREEN_WIDTH + 120;
groundBlock.y = SCREEN_HEIGHT - (groundBlock.height - 10);

const goal  = new Goal({ facingLeft: false });
const goal2 = new Goal({ facingLeft: true });

const pads = Pads.get(0);

Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);

Screen.display(() => {
    pads.update();

    background.draw(0, 0);
    shape.draw(0, 0);
    groundBlock.draw(0, groundBlock.y);

    if (pads.pressed(Pads.CROSS)) {
        goal2.setSize("BIG");
    }

    goal2.draw(SCREEN_WIDTH - goal2.width, groundBlock.y - (goal2.height - 5));
    goal.draw(0, groundBlock.y - (goal.height - 5));
});
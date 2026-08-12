const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Screen.getMode();

const ASSETS_PATH = Object.freeze({
    MAPS: "./assets/images/maps",
    SHAPES: "./assets/images/shapes",
    SOUNDS: "./assets/sounds",
    OBJECTS: "./assets/images/objects",
    CHARACTERS: "./assets/images/character"
})

const BOX2D_SCALE = 30;
const CATEGORY_GROUND = 0x0001;
const CATEGORY_HEAD = 0x0002;
const CATEGORY_FOOT = 0x0004;

const PLAYER_ONE_PORT = 0;
const PLAYER_TWO_PORT = 1;

export {
    ASSETS_PATH,
    SCREEN_WIDTH,
    BOX2D_SCALE,
    SCREEN_HEIGHT,
    CATEGORY_GROUND,
    CATEGORY_HEAD,
    CATEGORY_FOOT
}
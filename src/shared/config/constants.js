import gamepad from "../lib/gamepad.js";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Screen.getMode();

export {
    SCREEN_HEIGHT,
    SCREEN_WIDTH
}

export const ASSETS_PATH = Object.freeze({
    MAPS: "./assets/images/maps",
    SHAPES: "./assets/images/shapes",
    SOUNDS: "./assets/sounds",
    OBJECTS: "./assets/images/objects",
    CHARACTERS: "./assets/images/character"
})

export const PLAYER_ONE = gamepad.player(0);
export const PLAYER_ONE_PORT = 0;
export const PLAYER_TWO_PORT = 1;

export const BOX2D_SCALE = 30;
export const CATEGORY_GROUND = 0x0001;
export const CATEGORY_HEAD = 0x0002;
export const CATEGORY_FOOT = 0x0004;

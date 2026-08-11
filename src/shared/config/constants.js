const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Screen.getMode();

const ASSETS_PATH = Object.freeze({
    MAPS: "./assets/images/maps",
    SHAPES: "./assets/images/shapes",
    SOUNDS: "./assets/sounds",
    OBJECTS: "./assets/images/objects",
})

export {
    ASSETS_PATH,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
}
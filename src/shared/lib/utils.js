import { BOX2D_SCALE, SCREEN_HEIGHT, SCREEN_WIDTH } from "../config/constants.js";

function pixelToWorldY(pixelY) {
    return (SCREEN_HEIGHT - pixelY) / BOX2D_SCALE;
}

function pixelToWorldX(pixelX) {
    return (SCREEN_WIDTH - pixelX) / BOX2D_SCALE;
}

function worldToPixelY(worldY) {
    return SCREEN_HEIGHT - worldY * BOX2D_SCALE;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
    const twoPi = Math.PI * 2;
    angle = angle % twoPi;
    if (angle > Math.PI) angle -= twoPi;
    if (angle < -Math.PI) angle += twoPi;
    return angle;
}

export { pixelToWorldY, pixelToWorldX, worldToPixelY, clamp, normalizeAngle }
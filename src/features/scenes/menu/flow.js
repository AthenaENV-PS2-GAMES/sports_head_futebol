import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../../../shared/config/constants.js";
import GameScene from "../game/game.js";
import { MenuFlowScene } from "./scene.js";

export default class MenuFlow extends MenuFlowScene {
    static assetRoot = "assets";

    manifest() {
        return {
            images: [
                { path: "images/ui/logo.png", scale: 0.75 },
                { path: "images/maps/main.png" },
                { path: "images/ui/bg_blur.png" },
                { path: "images/ui/button.png", scale: 0.5 },
                { path: "images/ui/button_blur.png", scale: 0.5 },
                { path: "images/shapes/94.png" },
                { path: "images/ui/ball.png", scale: 0.75 }
            ],
            sounds: [
                "sounds/sfx/kick.adp",
                "sounds/sfx/pop.adp",
                "sounds/bg.wav"
            ],
            fonts: [
                "fonts/main.ttf"
            ]
        };
    }

    getPanels() {
        return {
            main: {
                getOptions: (scene) => [
                    { key: "New Game", action: () => scene.manager.goto(GameScene) },
                    { key: "Continue Game", action: () => { /**Carregar jogo */ } },
                    { key: "2 Player", action: () => { } },
                    { key: "Instructions", action: () => { } },
                    { key: "Settings", action: () => { } },
                ],
                draw: (scene) => {
                    scene.bg.draw(0, 0);
                    scene.bgBlur.draw(0, 0);
                    scene.bgLogo.draw((SCREEN_WIDTH / 2) - (scene.bgLogo.width / 2), 24);
                    scene.drawOptions(120);

                    // scene.ball.draw(100, 160);
                    // scene.ball.draw((SCREEN_WIDTH - 150) - (scene.ball.width / 2), 160);

                    scene.groundBlock.draw(0, SCREEN_HEIGHT - (this.groundBlock.height - 10))
                },
            },
        };
    }

    onEnter(assets) {
        super.onEnter(assets);
        this.bgSound = assets.sounds["sounds/bg.wav"];
        this.bgSound.loop = true;
        this.bgSound.play();

        this.groundBlock = assets.images["images/shapes/94.png"];
        this.groundBlock.width = SCREEN_WIDTH + 160;

        this.bg = assets.images["images/maps/main.png"];
        this.bg.width = SCREEN_WIDTH;
        this.bg.height = SCREEN_HEIGHT;

        this.bgBlur = assets.images["images/ui/bg_blur.png"];
        this.bgBlur.width = SCREEN_WIDTH;
        this.bgBlur.height = SCREEN_HEIGHT;

        this.bgLogo = assets.images["images/ui/logo.png"];

        this.ball = assets.images["images/ui/ball.png"];
    }

    onExit() {
        if(this.bgSound){
            this.bgSound.pause();
        }
    }
}
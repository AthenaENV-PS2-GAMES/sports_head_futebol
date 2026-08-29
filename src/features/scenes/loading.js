
const font = new Font('default');

export default class LoadingScreen {
    constructor() {
        // this.loading = Assets.image("assets/images/ui/loading.png", {
        //     animConfig: {
        //         totalFrames: 4,
        //         frames: [
        //             { x: 0, y: 0, width: 80, height: 16 },
        //             { x: 80, y: 0, width: 80, height: 16 },
        //             { x: 0, y: 16, width: 80, height: 16 },
        //             { x: 80, y: 16, width: 80, height: 16 }
        //         ]
        //     },
        //     lock: true
        // });

        // this.animState = {
        //     currentFrame: 0,
        //     frameTimer: 0,
        //     lastUpdate: Date.now(),
        //     startFrame: 0,
        //     endFrame: 3,
        //     loop: true,
        //     currentAnimation: "spin"
        // };
    }

    onDraw(progress) {
        Screen.clear(Color.new(8, 8, 12, 255));
        font.print("carregando", 250, 250)

        // const render = animationSprite(this.loading, this.animState, {
        //     fps: 4,
        //     scale: 2
        // });

        // if (!render) return;


        // this.loading.draw(this.x, this.y, {
        //     width: render.width,
        //     height: render.height,
        //     startx: render.startx,
        //     starty: render.starty,
        //     endx: render.endx,
        //     endy: render.endy
        // });
    }
}
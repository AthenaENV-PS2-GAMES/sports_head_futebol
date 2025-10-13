import Ball from "./src/models/ball/ball.js";
import Player from "./src/models/player/player.js";
import { collisionManager } from "./src/managers/collision.js";

const background = new Image('./assets/background.png')
// const shadow = new Image('./assets/shadow.png')
const goal = new Image('./assets/objects/goal.png')

const player = new Player(0, 1)
const ball = new Ball();

collisionManager.register({ // floor

    type: "rect",

    x: 0,
    y: 400,
    w: 640,
    h: 100
})

// collisionManager.register({ // goal 1

//     type: "rect",

//     x: 0,
//     y: 304,
//     w: 60,
//     h: 500
// })

// collisionManager.register({ // goal 2

//     type: "rect",

//     x: 580,
//     y: 304,
//     w: 60,
//     h: 500
// })

Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);
Screen.display(() => {

    background.draw(0, 0)
    // shadow.draw(0, 0)

    const dt = 16; // ms
    player.update(dt);
    ball.checkPlayerCollision(player);
    ball.checkFootCollision(player);
    ball.update(dt);

    collisionManager.checkCollisions()

    goal.width = 62;
    goal.draw(0, 356 - (goal.height / 2 + 5));
    goal.width = -Math.abs(goal.width)
    goal.draw(640, 356 - (goal.height / 2 + 5));

    console.log("Player X: " + player.character.position.x, " Player Y: " + player.character.position.y + " Rect X: " + 0 + " Rect Y: " + 400)

})
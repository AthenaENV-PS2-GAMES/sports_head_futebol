import { BOX2D_SCALE } from "../../shared/config/constants.js";
import { normalizeAngle, worldToPixelY } from "../../shared/lib/utils.js";

class PlayerRenderer {
  constructor(options) {
    this.physics = options.physics;
    this.headImage = options.headImage;
    this.feetImage = options.feetImage;

    this.facingLeft = options.facingLeft;
  }
  draw() {
    const headPos = this.physics.getHeadPosition();
    const footPos = this.physics.getFootPosition();
    const jointAngle = this.physics.getJointAngle();

    const headFlipX = this.facingLeft
      ? { startx: this.headImage.width, endx: 0 }
      : { startx: 0, endx: this.headImage.width };

    const hx = headPos.x * BOX2D_SCALE - this.headImage.width / 2;
    const hy = worldToPixelY(headPos.y) - this.headImage.height / 2;
    this.headImage.draw(hx, hy, { ...headFlipX });

    const fx = footPos.x * BOX2D_SCALE - this.feetImage.width / 2;
    const fy = worldToPixelY(footPos.y) - this.feetImage.height / 2;

    const feetFlipX = this.facingLeft
      ? { startx: 0, endx: this.feetImage.width }
      : { startx: this.feetImage.width, endx: 0 };

    const feetFlipY = this.facingLeft
      ? { starty: 0, endy: this.feetImage.height }
      : { starty: this.feetImage.height, endy: 0 };

    this.feetImage.draw(fx, fy, {
      angle: -jointAngle,
      ...feetFlipX,
      ...feetFlipY
    });
  }
  drawDebug() {
    const headPos = this.physics.getHeadPosition();
    const footPos = this.physics.getFootPosition();
    const anchor = this.physics.anchor;
    const orbitRadius = this.physics.footOrbitRadius;

    const anchorX = anchor.x * BOX2D_SCALE;
    const anchorY = worldToPixelY(anchor.y);
    const footX = footPos.x * BOX2D_SCALE;
    const footY = worldToPixelY(footPos.y);

    Draw.circle(anchorX, anchorY, 5, Color.new(255, 0, 0, 255), true);
    Draw.circle(footX, footY, 4, Color.new(0, 0, 255, 255), true);
    Draw.line(anchorX, anchorY, footX, footY, Color.new(255, 255, 0, 255));

    const segments = 32;
    let prevX = null;
    let prevY = null;

    for (let i = 0; i <= segments; i++) {
      const angle = (Math.PI * 2 * i) / segments;
      const x = anchorX + Math.cos(angle) * orbitRadius * BOX2D_SCALE;
      const y = anchorY - Math.sin(angle) * orbitRadius * BOX2D_SCALE;

      if (prevX !== null) {
        Draw.line(prevX, prevY, x, y, Color.new(255, 255, 0, 100));
      }
      prevX = x;
      prevY = y;
    }
  }
}



export default PlayerRenderer;
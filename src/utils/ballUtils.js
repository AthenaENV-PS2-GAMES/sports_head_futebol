const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export function ballVsPlayerFoot(ball, player) {
    const obb = player.getFootOBB();
    const dx = ball.position.x - obb.cx;
    const dy = ball.position.y - obb.cy;

    const du = dx * obb.u.x + dy * obb.u.y;
    const dv = dx * obb.v.x + dy * obb.v.y;

    const closestDu = clamp(du, -obb.halfW, obb.halfW);
    const closestDv = clamp(dv, -obb.halfH, obb.halfH);

    const closest = {
        x: obb.cx + closestDu * obb.u.x + closestDv * obb.v.x,
        y: obb.cy + closestDu * obb.u.y + closestDv * obb.v.y
    };

    const sepX = ball.position.x - closest.x;
    const sepY = ball.position.y - closest.y;
    const dist2 = sepX * sepX + sepY * sepY;
    const r2 = ball.radius * ball.radius;

    if (dist2 > r2) return { hit: false };

    const dist = Math.sqrt(dist2);
    const depth = ball.radius - dist;
    const normal = dist < 1e-4 ? { x: 0, y: 1 }
        : { x: sepX / dist, y: sepY / dist };

    const footU = (closestDu + obb.halfW) / (2 * obb.halfW);
    const footV = (closestDv + obb.halfH) / (2 * obb.halfH);

    return {
        hit: true,
        contact: closest,
        normal,
        depth,
        footPoint: { u: footU, v: footV }
    };
}

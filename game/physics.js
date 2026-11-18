import { LEVELS } from './levels.js';
import { aiControl, scoreGoal, tickClock, PU_NAMES } from './rules.js';

const S = 30;
const PI = Math.PI;

export class MatchPhysics {
  constructor(match, event = () => {}) {
    this.m = match;
    this.event = event;
    this.comeback = false;
    this.reset();
  }
  dispose() {
    if (this.world) {
      this.world.destroy();
      this.world = null;
    }
  }
  box(x, y, w, h, angle = 0, density = 0, group = 0, restitution = 0) {
    const b = this.world.createBody({
      type: density ? Box2D.DYNAMIC_BODY : Box2D.STATIC_BODY,
      position: {
        x: x / S,
        y: y / S,
      },
      angle,
    });

    b.createBoxShape({
      halfWidth: w / S / 2,
      halfHeight: h / S / 2,
      density,
      friction: 0.5,
      restitution,
      filter: {
        groupIndex: group,
      },
      enableContactEvents: true,
    });

    return b;
  }
  circle(x, y, r, density = 0, restitution = 0, fixed = false) {
    const b = this.world.createBody({
      type: density ? Box2D.DYNAMIC_BODY : Box2D.STATIC_BODY,
      position: {
        x: x / S,
        y: y / S,
      },
      fixedRotation: fixed,
      isBullet: !!density,
      enableSleep: false,
    });

    b.createCircleShape({
      radius: r / S,
      density,
      friction: fixed ? 0 : 1,
      restitution,
      enableContactEvents: true,
    });

    return b;
  }
  pos(b) {
    const p = b.getPosition();

    return {
      x: p.x * S,
      y: p.y * S,
    };
  }
  visual(kind, x, y, life, extra = {}) {
    if (this.visuals.length >= 64) {
      this.visuals.shift();
    }

    this.visuals.push({
      kind,
      x,
      y,
      life,
      total: life,
      ...extra,
    });
  }
  rings(x, y) {
    for (const dx of [-10, 10]) {
      for (const dy of [-10, 10]) {
        this.visual('ring', x + dx, y + dy, 9);
      }
    }
  }
  reset() {
    this.m.countdown = 90;
    this.m.overlay = 0;
    this.m.overlayText = null;
    this.dispose();

    this.world = Box2D.createWorld({
      gravity: {
        x: 0,
        y: 300 / S,
      },
      restitutionThreshold: 0,
      maximumLinearSpeed: 100,
    });

    this.box(-5, 240, 20, 480);
    this.box(805, 240, 20, 480);
    this.box(400, -5, 800, 20);
    this.box(50, 50, 60, 200, PI / 4);
    this.box(750, 50, 60, 200, -PI / 4);
    this.box(-20, 240, 60, 520, (8 * PI) / 180);
    this.box(820, 240, 60, 520, (-8 * PI) / 180);
    this.box(240, -20, 520, 60, (-8 * PI) / 180);
    this.box(560, -20, 520, 60, (8 * PI) / 180);
    this.posts = [this.box(40, 345, 80, 10), this.box(760, 345, 80, 10)];
    this.ground = this.box(400, 470, 800, 20, 0, 0, -1);

    for (const p of LEVELS[this.m.level - 1]) {
      if (p.kind === 'circle') {
        this.circle(p.x, p.y, p.w / 2);
      } else {
        this.box(p.x, p.y, p.w, p.h, p.angle);
      }
    }

    this.ballSize = 1;
    this.bouncy = 1;
    this.ball = this.circle(400, 230, 10, 1.5, 0.6);
    this.ball.setLinearVelocity((-150 + Math.random() * 300) / S, -100 / S);
    this.players = [this.player(200, false), this.player(600, true)];
    this.powers = [];
    this.bombs = [];
    this.effects = [];
    this.visuals = [];
    this.spawnTicks = 0;
    this.pointAge = 0;
    this.goalHeights = [345, 345];
    this.goalTimers = [0, 0];
    this.ballTimers = [0, 0];
    this.fire = 0;
    this.streaker = null;
    this.sender = 1;
    this.flags = {};
    this.saveTimer = 1000;
    this.kickTimer = 0;
    this.kickSpeed = 0;
  }
  player(x, right) {
    const body = this.circle(x, 440, 20, 100, 0.01, true);
    const angle = right ? 1.37 + PI : -1.37 + PI;
    const foot = this.box(x + (right ? 4 : -4), 455.6, 40, 10, angle, 2, -1, 1);

    const joint = this.world.createRevoluteJoint(body, foot, {
      anchor: {
        x: x / S,
        y: 440 / S,
      },
      enableMotor: true,
      maxMotorTorque: 100000,
      collideConnected: false,
    });

    return {
      body,
      foot,
      joint,
      speed: 0,
      size: 1,
      speedPU: 1,
      jumpPU: 1,
      freeze: 0,
      broken: 0,
      sizeTimer: 0,
      speedTimer: 0,
      jumpTimer: 0,
      bombed: 0,
      lastUp: false,
    };
  }
  changeSize(i, size) {
    const p = this.players[i];

    p.size = size;

    for (const s of p.body.getShapes()) {
      s.destroy();
    }

    p.body.createCircleShape({
      radius: (20 * size) / S,
      density: 100,
      friction: 0,
      restitution: 0.01,
      enableContactEvents: true,
    });

    const pos = this.pos(p.body);
    const right = i === 1;

    p.foot.destroy();

    p.foot = this.box(
      pos.x + (right ? 4 : -4) * size,
      pos.y + 15.6 * size,
      40 * size,
      10 * size,
      right ? 1.37 + PI : -1.37 + PI,
      2,
      -1,
      1,
    );

    p.joint = this.world.createRevoluteJoint(p.body, p.foot, {
      anchor: {
        x: pos.x / S,
        y: pos.y / S,
      },
      enableMotor: true,
      maxMotorTorque: 100000,
      collideConnected: false,
    });
  }
  changeBall() {
    const p = this.pos(this.ball);
    const v = this.ball.getLinearVelocity();
    const a = this.ball.getAngle();
    const w = this.ball.getAngularVelocity();

    this.ball.destroy();
    this.ball = this.circle(p.x, p.y, 5 + 5 * this.ballSize, 0.6, 0.3 + 0.3 * this.bouncy);
    this.ball.setTransform(p.x / S, p.y / S, a);
    this.ball.setLinearVelocity(v.x, v.y);
    this.ball.setAngularVelocity(w);
    this.rings(p.x, p.y);
  }
  power(type, owner) {
    const p = this.players[owner];
    const other = this.players[1 - owner];

    this.event('power', PU_NAMES[type - 1]);

    if (type === 1 || type === 2) {
      p.speedPU = type === 1 ? 2 : 0;
      p.speedTimer = 200;
    }

    if (type === 3 || type === 4) {
      p.jumpPU = type === 3 ? 2 : 0;
      p.jumpTimer = 200;
    }

    if (type === 5 || type === 6) {
      (type === 5 ? other : p).freeze = 200;
    }

    if (type === 7 || type === 8) {
      const side = 1 - owner;

      this.goalHeights[side] = type === 7 ? 305 : 385;
      this.goalTimers[side] = 600;
      this.posts[side].setPosition((side ? 760 : 40) / S, this.goalHeights[side] / S);
    }

    if (type === 9) {
      this.fire = 700;
    }

    if (type === 10 || type === 12) {
      this.ballSize = type === 10 ? 2 : 0;
      this.ballTimers[0] = 400;
      this.changeBall();
    }

    if (type === 11 || type === 13) {
      this.bouncy = type === 11 ? 2 : 0;
      this.ballTimers[1] = 200;
      this.changeBall();
    }

    if (type === 14 || type === 15) {
      this.changeSize(owner, type === 14 ? 1.5 : 0.5);
      p.sizeTimer = 600;
    }

    if (type === 16 || type === 17) {
      const side = type === 16 ? 1 - owner : owner;

      this.players[side].broken = side === 0 ? 400 : 200;
    }

    if (type === 18 && !this.streaker) {
      this.streaker = {
        body: this.circle(400, 300, 20, 100, 0.01, true),
        life: 1000,
        target: 100 + Math.random() * 600,
      };
    }
  }
  update(input) {
    const m = this.m;

    if (m.over) {
      return;
    }

    if (m.goal) {
      tickClock(m);

      if (!m.goal) {
        this.reset();
      }

      return;
    }

    const b = this.pos(this.ball);
    const bv = this.ball.getLinearVelocity();

    b.vx = bv.x * S;

    for (const e of this.visuals) {
      e.life--;
      e.x += e.vx || 0;
      e.y += e.vy || 0;
    }

    this.visuals = this.visuals.filter((e) => e.life > 0);

    if (this.pointAge % 2 === 0) {
      this.visual('trail', b.x, b.y, 20);
    }

    const op = this.players[0];
    const opos = this.pos(op.body);

    let ai = aiControl(m.level, this.pointAge, b, opos, op.foot.getAngle(), op.lastUp);

    if (op.foot.getAngle() < 0.2) {
      op.lastUp = true;
    } else if (op.foot.getAngle() > 1.5) {
      op.lastUp = false;
    }

    const controls = m.multi ? input : [ai, input[0]];

    for (let i = 0; i < 2; i++) {
      const p = this.players[i];
      const right = i === 1;
      const c = controls[i];
      const pos = this.pos(p.body);
      const v = p.body.getLinearVelocity();

      const accel =
        !m.multi && !right ? (30 + p.speedPU * 20) * (1 + m.level / 20) : 50 + p.speedPU * 30;

      if (!p.freeze && !p.bombed) {
        p.speed += accel * (c.move > 0 && pos.x >= 720 ? 0 : c.move);
      }

      if (!p.freeze && !p.bombed && c.move && pos.y > 439 && this.pointAge % 2 === 0) {
        this.visual('dust', pos.x, 460, 10, {
          vx: (c.move < 0 ? 1 : -1) * (2 + Math.random() * 2),
          vy: -Math.random() * 2,
        });
      }

      p.speed *= 0.7;

      const above = this.pos(this.players[1 - i].body);

      if (
        c.jump &&
        !p.bombed &&
        (pos.y + 20 * p.size > 459 ||
          (Math.abs(pos.x - above.x) < 30 &&
            pos.y < above.y &&
            pos.y > above.y - 45 &&
            v.y * S >= 1))
      ) {
        v.y =
          (!right && !m.multi ? -175 - (40 * m.level) / 10 - p.jumpPU * 50 : -150 - p.jumpPU * 50) /
          S;

        this.event('jump');

        this.visual(p.jumpPU ? 'greenRing' : 'redRing', pos.x, pos.y + 20, 7, {
          jump: true,
        });

        if (p.jumpPU === 2) {
          this.visual('greenRing', pos.x, pos.y, 7, {
            jump: true,
          });
        }
      }

      if (i === 0 && !m.multi) {
        this.kickSpeed *= 0.8;
      }

      p.body.setLinearVelocity(
        (p.speed + (i === 0 && !m.multi ? this.kickSpeed : 0)) / S,
        v.y + (!right && !m.multi ? 10 : 5) / S,
      );

      const target = right
        ? c.kick && !p.broken
          ? 1.87
          : 1.67 - PI + 1.2
        : c.kick && !p.broken
          ? -PI + 1.2 + PI / 2 - 1.67
          : 0.2 + PI / 2 - 1.67;

      if (!p.bombed) {
        p.joint.setMotorSpeed(-(c.kick && !p.broken ? 12 : 6) * (p.joint.getAngle() - target));
      }

      for (const key of ['freeze', 'broken', 'bombed']) {
        if (p[key] > 0) {
          p[key]--;
        }
      }

      if (p.sizeTimer > 0 && !--p.sizeTimer) {
        this.changeSize(i, 1);
      }

      if (p.speedTimer > 0 && !--p.speedTimer) {
        p.speedPU = 1;
      }

      if (p.jumpTimer > 0 && !--p.jumpTimer) {
        p.jumpPU = 1;
      }
    }

    for (let i = 0; i < 2; i++) {
      if (this.goalTimers[i] > 0 && !--this.goalTimers[i]) {
        this.goalHeights[i] = 345;
        this.posts[i].setPosition((i ? 760 : 40) / S, 345 / S);
      }

      if (this.ballTimers[i] > 0 && !--this.ballTimers[i]) {
        if (i) {
          this.bouncy = 1;
        } else {
          this.ballSize = 1;
        }

        this.changeBall();
      }
    }

    if (++this.spawnTicks > 200) {
      this.spawnTicks = 0;

      const pu = {
        type: 1 + Math.floor(Math.random() * 18),
        x: 220 + Math.random() * 360,
        y: 150 + Math.random() * 270,
        life: 600,
      };

      this.powers.push(pu);
      this.rings(pu.x, pu.y);
      this.event('spawn');
    }

    if (this.fire > 0) {
      const elapsed = 700 - this.fire--;

      if (elapsed === 0 || elapsed === 39 || elapsed === 79) {
        const bx = 20 + Math.random() * 760;

        this.bombs.push({
          x: bx,
          y: 50,
          vy: 0,
        });

        this.rings(bx, 50);
      }

      if (!this.fire) {
        for (const p of this.players) {
          p.bombed = 0;
        }
      }
    }

    if (this.streaker) {
      const st = this.streaker;
      const p = this.pos(st.body);
      const v = st.body.getLinearVelocity();

      if (Math.abs(p.x - st.target) < 10) {
        st.target = 100 + Math.random() * 600;
      }

      st.body.setLinearVelocity((p.x < st.target ? 100 : -100) / S, p.y > 439 ? -300 / S : v.y);

      if (!--st.life) {
        st.body.destroy();
        this.streaker = null;
      }
    }

    if (!m.multi) {
      if (++this.saveTimer === 100) {
        this.event('achievement', 4);
      }

      if (this.kickTimer > 0 && --this.kickTimer && opos.x < 120) {
        this.event('achievement', 17);
      }
    }

    for (let i = 0; i < 3; i++) {
      this.world.step(1 / 96, 4);

      const hits = this.world.getContactEvents().begin;

      for (const hit of hits) {
        const a = hit.shapeA.getBody();
        const c = hit.shapeB.getBody();

        if (a === this.ball || c === this.ball) {
          for (let j = 0; j < 2; j++) {
            if (
              a === this.players[j].body ||
              c === this.players[j].body ||
              a === this.players[j].foot ||
              c === this.players[j].foot
            ) {
              this.sender = j;

              const pp = this.pos(this.players[j].body);
              const other = this.pos(this.players[1 - j].body);
              const foot = a === this.players[j].foot || c === this.players[j].foot;

              this.flags = {
                2: j === 1 && b.x > 400,
                3: j === 0 && pp.x < 300,
                8: j === 1 && foot && pp.x < 200,
                9: j === 1 && !foot && Math.abs(pp.x - other.x) < 20 && pp.y < other.y,
                13: j === 1 && foot && pp.y < 440,
              };

              if (j === 1 && pp.x > 600 && bv.x * S > 200) {
                this.saveTimer = 0;
              }
            }
          }

          if (bv.x * bv.x + bv.y * bv.y > (200 / S) ** 2) {
            this.event('kick');
            this.visual('ring', b.x, b.y, 9);
          }
        }

        if (
          !m.multi &&
          input[0].kick &&
          ((a === this.players[1].foot && c === this.players[0].body) ||
            (c === this.players[1].foot && a === this.players[0].body))
        ) {
          let angle = this.players[1].foot.getAngle();

          if (angle < 0) {
            angle += 2 * PI;
          }

          if (angle > 4.75 && angle < 6) {
            const vel = op.body.getLinearVelocity();

            this.kickTimer = 100;
            this.kickSpeed = -600;
            op.body.setLinearVelocity(vel.x, vel.y - 60 / S);
          }
        }
      }
    }

    const ball = this.pos(this.ball);
    const r = 5 + 5 * this.ballSize;

    if (ball.y + r > this.goalHeights[0] + 15 && ball.x - r < 70) {
      this.scorer = 1;
      scoreGoal(m, 1);
    } else if (ball.y + r > this.goalHeights[1] + 15 && ball.x + r > 730) {
      this.scorer = 0;
      scoreGoal(m, 0);
    }

    if (m.goal || m.over) {
      if (!m.multi) {
        if (m.score[0] >= m.score[1] + 3) {
          this.comeback = true;
        }

        if (ball.x < 400) {
          for (const id of [2, 3, 8, 9, 13]) {
            if (this.flags[id]) {
              this.event('achievement', id);
            }
          }

          if (m.timeMode && m.time <= 5 && m.score[1] === m.score[0] + 1 && !m.sudden) {
            this.event('achievement', 5);
          }

          if (m.timeMode && m.time > 55) {
            this.event('achievement', 6);
          }

          if (this.streaker) {
            this.event('achievement', 11);
          }

          if (this.players[1].size < 1) {
            this.event('achievement', 14);
          }

          if (this.players[1].size > 1) {
            this.event('achievement', 16);
          }

          if (this.goalHeights[0] === 385) {
            this.event('achievement', 15);
          }
        } else {
          this.saveTimer = 1000;
        }
      }

      this.event('goal');

      if (m.over) {
        this.event('finish');
      }

      return;
    }

    for (let k = this.powers.length - 1; k >= 0; k--) {
      const pu = this.powers[k];

      let collected = false;

      if ((ball.x - pu.x) ** 2 + (ball.y - pu.y) ** 2 < 35 * 35) {
        this.power(pu.type, this.sender);
        collected = true;
      }

      if (collected || !--pu.life) {
        this.powers.splice(k, 1);
      }
    }

    for (let k = this.bombs.length - 1; k >= 0; k--) {
      const bomb = this.bombs[k];

      bomb.vy += 0.2;
      bomb.y += bomb.vy;

      if (bomb.y >= 470) {
        for (const p of this.players) {
          const pp = this.pos(p.body);

          if ((pp.x - bomb.x) ** 2 + (pp.y - 470) ** 2 < 2500) {
            p.bombed = Math.max(1, this.fire);
          }
        }

        this.effects.push({
          x: bomb.x,
          y: 470,
          life: 20,
        });

        this.bombs.splice(k, 1);
        this.event('explosion');
      }
    }

    this.effects = this.effects.filter((e) => --e.life > 0);
    this.pointAge++;
    tickClock(m);

    if (m.over) {
      this.event('finish');
    }
  }
}

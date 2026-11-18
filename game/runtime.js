import { ART } from './art.js';
import { NAMES, newMatch } from './rules.js';
import { MatchPhysics } from './physics.js';
import { createStore } from './save.js';
import { ACHIEVEMENTS } from './achievements.js';

export function startGame() {
  Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);

  const mode = Screen.getMode();
  const scale = Math.min(mode.width / 800, mode.height / 540);
  const ox = (mode.width - 800 * scale) / 2;
  const oy = (mode.height - 540 * scale) / 2;
  const store = createStore();
  const data = store.data;

  const font = new Font('assets/fonts/main.ttf', {
    size: 22,
  });

  font.outline = 1;
  font.outlineColor = Color.new(255, 255, 255);

  const white = Color.new(255, 255, 255);
  const green = Color.new(0, 80, 0);
  const black = Color.new(10, 25, 10);
  const hudGreen = Color.new(0, 50, 0);
  const textures = {};

  function tex(name) {
    return textures[name] || (textures[name] = new Image('assets/flash/' + name + '.png'));
  }

  function rect(x, y, w, h, color) {
    Draw.rect(ox + x * scale, oy + y * scale, w * scale, h * scale, color);
  }

  function text(x, y, value, size = 22, color = green, center = false) {
    font.scale = (size * scale) / 22;
    font.color = color;

    if (center) {
      x -= font.getTextSize(String(value)).width / scale / 2;
    }

    font.print(ox + x * scale, oy + y * scale, String(value));
  }

  function mid(x, cy, value, size, color, align = 'center') {
    font.scale = (size * scale) / 22;
    font.color = color;

    const w = font.getTextSize(String(value)).width / scale;

    font.print(
      ox + (align === 'right' ? x - w : align === 'left' ? x : x - w / 2) * scale,
      oy + (cy - size * 0.62) * scale,
      String(value),
    );
  }

  function printStyle(x, y, value, size, color, center, outline, outlineColor) {
    const oldOutline = font.outline;
    const oldColor = font.outlineColor;

    font.outline = outline;
    font.outlineColor = outlineColor;
    text(x, y, value, size, color, center);
    font.outline = oldOutline;
    font.outlineColor = oldColor;
  }

  function picture(
    name,
    x = 0,
    y = 0,
    w = 800,
    h = 540,
    flip = false,
    angle = 0,
    color = null,
    originX = null,
    originY = null,
  ) {
    const opts = {
      width: w * scale,
      height: h * scale,
      flipX: flip,
      angle,
    };

    if (color) {
      opts.color = color;
    }

    if (originX !== null) {
      opts.originX = originX;
    }

    if (originY !== null) {
      opts.originY = originY;
    }

    tex(name).draw(ox + x * scale, oy + y * scale, opts);
  }

  function effect(e) {
    let name = e.kind;
    let w;
    let h;
    let color = white;

    if (name === 'ring' || name === 'greenRing' || name === 'redRing') {
      name += e.total - e.life + 1;
    }

    const a = ART[name];

    w = a.w / 0.8;
    h = a.h / 0.8;

    if (e.kind === 'trail') {
      w = h = (16 * e.life) / 20;
    }

    if (e.kind === 'dust') {
      w = h = 10 + (10 - e.life) / 2;
      color = Color.new(255, 255, 255, Math.floor((255 * 0.6 * e.life) / 10));
    }

    if (e.jump) {
      w = 60;
      h = 30;
    }

    tex(name).draw(ox + (e.x - w / 2) * scale, oy + (e.y - h / 2) * scale, {
      width: w * scale,
      height: h * scale,
      color,
    });
  }

  function sprite(name, x, y, factor = 1, flip = false, angle = 0, color = null) {
    const a = ART[name];
    const pivotX = (flip ? a.w / 0.8 - a.ox : a.ox) * factor;
    const pivotY = a.oy * factor;

    picture(
      name,
      x - pivotX,
      y - pivotY,
      (a.w / 0.8) * factor,
      (a.h / 0.8) * factor,
      flip,
      angle,
      color,
      angle ? pivotX * scale : null,
      angle ? pivotY * scale : null,
    );
  }

  for (const name of [
    'field',
    'ball',
    'goal',
    'footL',
    'footR',
    ...Array.from(
      {
        length: 10,
      },
      (_, i) => 'head' + (i + 1),
    ),
  ]) {
    tex(name);
  }

  const pads = [Gamepad.player(0), Gamepad.player(1)];
  const sounds = {};

  let music = null;
  let musicLayer = null;

  try {
    for (const name of [
      'kick',
      'jump',
      'pop',
      'coin',
      'whistle',
      'cheer',
      'explosion',
      'die',
      'intro',
    ]) {
      sounds[name] = new Sound.Sfx('assets/audio/' + name + '.adp');
    }

    music = new Sound.Stream('assets/audio/music.wav');
    music.loop = true;
    Sound.setVolume(70);
    musicLayer = new Sound.Sfx('assets/audio/music_layer.adp');
    musicLayer.volume = 70;
  } catch (e) {}

  let musicStarted = false;

  function startMusic() {
    if (musicStarted) {
      return;
    }

    musicStarted = true;

    if (music && data.music) {
      music.play();

      if (musicLayer) {
        musicLayer.play();
      }
    }
  }

  function sound(name) {
    if (data.sfx && sounds[name]) {
      sounds[name].play();
    }
  }

  function toggleMusic() {
    data.music = !data.music;

    if (music && musicStarted) {
      if (data.music) {
        music.play();

        if (musicLayer) {
          musicLayer.play();
        }
      } else {
        music.pause();

        if (musicLayer) {
          musicLayer.stop();
        }
      }
    }

    store.save();
  }

  function toggleSfx() {
    data.sfx = !data.sfx;
    store.save();
  }

  let screen = 'splash';
  let splashTick = 0;
  let splashLive = true;
  let cursor = 0;
  let level = 1;
  let multi = false;
  let face2 = 1;
  let m = null;
  let sim = null;
  let paused = false;
  let brief = false;
  let ach = null;
  let suddenTicks = 0;
  let frame = 0;
  let done = false;
  let endTicks = 0;
  let back = 'menu';
  let transitionFrom = null;
  let transitionCursor = 0;
  let transitionTicks = 0;
  let pendingDispose = false;

  function award(id) {
    if (data.achievements[id - 1]) {
      return;
    }

    data.achievements[id - 1] = true;

    ach = {
      id,
      t: 0,
    };

    sound('cheer');
    store.save();
  }

  function go(s) {
    if (s !== screen) {
      transitionFrom = screen;
      transitionCursor = cursor;
      transitionTicks = 20;
    }

    screen = s;
    cursor = 0;
  }

  function start(l = level, two = multi) {
    if (sim) {
      sim.dispose();
    }

    level = l;
    multi = two;
    m = newMatch(level, multi);
    paused = false;
    brief = true;
    ach = null;
    suddenTicks = 0;
    done = false;
    endTicks = 0;

    sim = new MatchPhysics(m, (kind, label) => {
      if (kind === 'achievement') {
        award(label);
      } else if (kind === 'power') {
        if (label) {
          m.overlayText = label;
          m.overlay = 0;
        }

        sound('coin');
      } else if (kind === 'goal') {
        sound('die');

        if (sim.scorer === 1) {
          sound('cheer');
        }
      } else if (kind === 'finish') {
        finish();
      } else {
        sound(kind === 'spawn' ? 'pop' : kind);
      }
    });

    tex('walls' + level);
    go('game');
  }

  function finish() {
    if (done) {
      return;
    }

    done = true;
    endTicks = 0;
    sound('whistle');

    if (!multi) {
      if (m.score[0] === 0) {
        award(1);
      }

      if (sim.comeback && m.winner === 1) {
        award(10);
      }

      const old = data.scores[level - 1];
      const won = data.wins[level - 1];

      if (
        m.timeMode ||
        (m.winner === 1 ? !won || old[0] >= m.score[0] : !won && old[1] <= m.score[1])
      ) {
        data.scores[level - 1] = m.score.slice();
        data.wins[level - 1] = m.winner === 1;
      }

      if (data.wins.every(Boolean)) {
        award(12);
      }

      store.save();
    } else {
      award(7);
      store.save();
    }
  }

  function controls(p) {
    let move = (p.pressed(Gamepad.RIGHT) ? 1 : 0) - (p.pressed(Gamepad.LEFT) ? 1 : 0);

    if (Math.abs(p.leftX) > 0.4) {
      move = p.leftX > 0 ? 1 : -1;
    }

    return {
      move,
      jump: p.pressed(Gamepad.CROSS) || p.pressed(Gamepad.UP),
      kick: p.pressed(Gamepad.SQUARE) || p.pressed(Gamepad.R1),
    };
  }

  const pressed = (button) => pads[0].justPressed(button);
  const confirm = () => pressed(Gamepad.CROSS) || pressed(Gamepad.START);
  const up = () => pressed(Gamepad.UP);
  const down = () => pressed(Gamepad.DOWN);
  const left = () => pressed(Gamepad.LEFT);
  const right = () => pressed(Gamepad.RIGHT);

  function navigate(count) {
    const delta = (down() ? 1 : 0) - (up() ? 1 : 0);

    if (delta) {
      cursor = (cursor + delta + count) % count;
      sound('pop');
    }
  }

  function update() {
    frame++;
    Gamepad.update();
    store.poll();
    Sound.process();

    if (ach && ++ach.t >= 200) {
      ach = null;
    }

    if (suddenTicks > 0) {
      suddenTicks--;
    }

    if (transitionTicks > 0) {
      if (!--transitionTicks) {
        transitionFrom = null;

        if (pendingDispose) {
          if (sim) {
            sim.dispose();
          }

          sim = null;
          pendingDispose = false;
        }
      }

      return;
    }

    if (pressed(Gamepad.L2)) {
      toggleMusic();
    }

    if (pressed(Gamepad.R2)) {
      toggleSfx();
    }

    if (screen === 'splash') {
      if (splashTick === 45) {
        sound('intro');
      }

      if (confirm() || ++splashTick >= ART.mbIntro.frames) {
        if (sounds.intro) {
          sounds.intro.stop();
        }

        startMusic();
        go('instructions');
      }
    } else if (screen === 'menu') {
      navigate(4);

      if (pressed(Gamepad.L1)) {
        toggleMusic();
      }

      if (pressed(Gamepad.R1)) {
        toggleSfx();
      }

      if (confirm()) {
        sound('kick');

        if (cursor === 0) {
          multi = false;
          data.wins.fill(false);
          data.scores = data.scores.map(() => [0, 0]);
          store.save();
          go('levels');
        } else if (cursor === 1) {
          if (store.hasSave) {
            multi = false;
            go('levels');
          }
        } else if (cursor === 2) {
          multi = true;
          go('multi');
        } else {
          go('instructions');
        }
      }
    } else if (screen === 'levels') {
      const before = cursor;

      if (cursor >= 10) {
        if (left()) {
          cursor = 10 + ((cursor - 10 + 2) % 3);
        }

        if (right()) {
          cursor = 10 + ((cursor - 9) % 3);
        }

        if (up()) {
          cursor = [5, 7, 9][cursor - 10];
        }

        if (down()) {
          cursor = [0, 2, 4][cursor - 10];
        }
      } else {
        if (left()) {
          cursor = cursor % 5 ? cursor - 1 : cursor + 4;
        }

        if (right()) {
          cursor = cursor % 5 < 4 ? cursor + 1 : cursor - 4;
        }

        if (up()) {
          cursor = cursor < 5 ? [10, 10, 11, 12, 12][cursor] : cursor - 5;
        }

        if (down()) {
          cursor = cursor < 5 ? cursor + 5 : [10, 10, 11, 12, 12][cursor - 5];
        }
      }

      if (cursor !== before) {
        sound('pop');
      }

      if (pressed(Gamepad.L1)) {
        data.face = (data.face % 10) + 1;
      }

      if (pressed(Gamepad.R1)) {
        data.face = ((data.face + 8) % 10) + 1;
      }

      if (pressed(Gamepad.TRIANGLE)) {
        back = 'levels';
        sound('kick');
        go('achievements');

        return;
      }

      if (confirm() && cursor >= 10) {
        sound('kick');

        if (cursor === 12) {
          back = 'levels';
        }

        go(['menu', 'instructions', 'achievements'][cursor - 10]);
      } else if (confirm() && (cursor === 0 || data.wins[cursor] || data.wins[cursor - 1])) {
        sound('kick');
        start(cursor + 1, false);
      } else if (pressed(Gamepad.CIRCLE)) {
        sound('kick');
        go('menu');
      }
    } else if (screen === 'multi') {
      const delta = (right() ? 1 : 0) - (left() ? 1 : 0);

      if (delta) {
        data.face = ((data.face - 1 + delta + 10) % 10) + 1;
      }

      if (pads[1].justPressed(Gamepad.RIGHT)) {
        face2 = (face2 % 10) + 1;
      }

      if (pads[1].justPressed(Gamepad.LEFT)) {
        face2 = ((face2 + 8) % 10) + 1;
      }

      if (confirm()) {
        sound('kick');
        start(1, true);
      } else if (pressed(Gamepad.CIRCLE)) {
        sound('kick');
        go('menu');
      }
    } else if (screen === 'achievements') {
      if (pressed(Gamepad.CIRCLE) || confirm()) {
        sound('kick');
        go(back);
      }
    } else if (screen === 'instructions') {
      if (confirm() || pressed(Gamepad.CIRCLE)) {
        sound('kick');
        go('menu');
      }
    } else if (screen === 'game') {
      if ((pads[0].justDisconnected || (pads[1].justDisconnected && multi)) && !m.over) {
        paused = true;
      }

      if (brief) {
        if (confirm()) {
          brief = false;
        }
      } else if (m.over) {
        if (++endTicks >= (multi ? 100 : 60)) {
          go(multi ? 'menu' : 'levels');
          pendingDispose = true;
        }
      } else {
        if (pressed(Gamepad.SELECT)) {
          go('levels');
          pendingDispose = true;
        } else if (pressed(Gamepad.START) || (pads[1].justPressed(Gamepad.START) && multi)) {
          paused = !paused;
        }

        if (screen === 'game' && paused) {
          if (pressed(Gamepad.CIRCLE)) {
            go('menu');
            pendingDispose = true;
          }
        } else if (screen === 'game' && m.countdown > 0) {
          m.countdown--;
          m.overlay++;
        } else if (screen === 'game') {
          m.overlay++;
          m.flash++;

          if (m.timeMode && m.time === 10 && m.ticks === 0 && !m.sudden) {
            m.flash = 0;
          }

          const wasSudden = m.sudden;

          sim.update([controls(pads[0]), controls(pads[1])]);

          if (!wasSudden && m.sudden) {
            suddenTicks = 80;
          }

          if (m.over && !done) {
            finish();
          }
        }
      }
    }
  }

  function head(n, x, y, size = 1, flip = false) {
    const a = ART.heads[n - 1];

    picture('head' + n, x - 26 * size, y - 26 * size, (a.w / 0.8) * size, (a.h / 0.8) * size, flip);
  }

  function draw() {
    const targetScreen = screen;
    const targetCursor = cursor;

    if (transitionTicks > 0 && transitionFrom) {
      screen = transitionFrom;
      cursor = transitionCursor;
    }

    if (screen === 'splash') {
      const n = Math.min(splashTick + 1, ART.mbIntro.frames);
      const a = ART.mbIntro;

      picture('splash');
      picture('mbIntro' + n, 390 - a.ox, 291.95 - a.oy, a.w / 0.8, a.h / 0.8);

      if (n < a.frames) {
        tex('mbIntro' + (n + 1));
      }

      for (const k of [n - 1, n - 2]) {
        if (textures['mbIntro' + k]) {
          textures['mbIntro' + k].free();
          delete textures['mbIntro' + k];
        }
      }
    } else if (screen === 'menu') {
      picture('menu');
      sprite('menuBall' + ((frame % 48) + 1), 150, 200);
      sprite('menuBall' + ((frame % 48) + 1), 650, 200);

      const names = ['newGame', 'continueGame', 'twoPlayer', 'menuInstructions'];
      const xs = [400, 400, 300, 400];
      const ys = [160.5, 230.5, 275.5, 345.5];

      for (let i = 0; i < names.length; i++) {
        const unavailable = i === 1 && !store.hasSave;

        sprite(
          i === cursor && !unavailable ? names[i] + 'Hover' : names[i],
          xs[i],
          ys[i],
          1,
          false,
          0,
          unavailable ? Color.new(128, 128, 128, 64) : null,
        );
      }

      sprite(data.music ? 'musicOn' : 'musicOff', 762.4, 4.05, 0.325);
      sprite(data.sfx ? 'sfxOn' : 'sfxOff', 779.2, 5, 0.5);
    } else if (screen === 'levels') {
      picture('levels');
      head(data.face, 398, 133, 0.8, true);

      const outline = font.outline;

      font.outline = 1;

      for (let i = 0; i < 10; i++) {
        const x = 100 + (i % 5) * 150;
        const y = i < 5 ? 240 : 390;
        const unlocked = i === 0 || data.wins[i - 1];
        const state = data.wins[i] ? 3 : unlocked ? 2 : 1;

        sprite('levelbox' + state + (cursor === i ? 'Hover' : ''), x, y);
        mid(x - 52, y - 34, String(i + 1), 42, white, 'left');

        const [first, ...rest] = NAMES[i].toUpperCase().split(' ');

        font.outline = 0;
        mid(x + 54, y - 40, first, 17, white, 'right');

        if (rest.length) {
          mid(x + 54, y - 22, rest.join(' '), 17, white, 'right');
        }

        font.outline = 1;
        mid(x, y + 21, data.scores[i][1] + ' - ' + data.scores[i][0], 42, white);
      }

      font.outline = outline;

      [
        ['levelMenu', 7],
        ['levelInstructions', 272],
        ['levelAchievements', 382],
      ].forEach(([n, x], k) => {
        sprite(cursor === 10 + k ? n + 'Hover' : n, x, 489.5);
      });

      sprite(data.music ? 'musicOn' : 'musicOff', 762.4, 4.05, 0.325);
      sprite(data.sfx ? 'sfxOn' : 'sfxOff', 779.2, 5, 0.5);
    } else if (screen === 'multi') {
      picture('menu');
      picture('choose');
      head(data.face, 300, 275, 1, true);
      head(face2, 490, 275, 1, true);
    } else if (screen === 'achievements') {
      picture('achievementScreen');

      for (let i = 0; i < 17; i++) {
        sprite(data.achievements[i] ? 'badgeOn' : 'badgeOff', 100, 90 + i * 26);
      }
    } else if (screen === 'instructions') {
      picture('instructions');

      const ringFrame = (frame % 30) + 1;

      for (const y of [185.15, 234.65, 284.15, 333.65, 384.15, 433.65]) {
        sprite('ringGreen' + ringFrame, 110.2, y, 0.825);
        sprite('ringRed' + ringFrame, 338.45, y, 0.825);
      }

      for (const [x, y] of [
        [554.35, 185.15],
        [554.35, 234.65],
        [552.95, 284.15],
        [552.95, 333.65],
        [552.95, 384.15],
        [552.95, 433.65],
      ]) {
        sprite('ringYellow' + ringFrame, x, y, 0.825);
      }

      printStyle(400, 68, '10 MATCHES', 16, white, true, 1, black);

      printStyle(
        400,
        97,
        'MOVE: D-PAD / LEFT STICK   JUMP: X / UP   KICK: SQUARE / R1',
        14,
        white,
        true,
        1,
        black,
      );

      printStyle(
        400,
        119,
        'HITTING POWER-UPS WITH THE BALL WILL AFFECT THE GAME IN VARIOUS WAYS',
        13,
        white,
        true,
        1,
        black,
      );
    } else if (screen === 'game') {
      picture('field');
      sprite('walls' + level, 0, 0);

      if (!brief) {
        const sh = ART.shadow;

        picture('shadow', sim.pos(sim.ball).x - sh.ox, 463 - sh.oy / 3, sh.w / 0.8, sh.h / 0.8 / 3);
      }

      for (const e of sim.visuals) {
        effect(e);
      }

      mid(24, 32, m.score[0], 50, white);
      mid(776, 32, m.score[1], 50, white);

      if (!brief && (m.flash < 6 || (m.flash > 12 && m.flash < 18))) {
        sprite('flasher', 400, 5);
      }

      if (m.timeMode) {
        mid(
          400,
          21,
          Math.floor(m.time / 60) + ':' + String(m.time % 60).padStart(2, '0'),
          30,
          hudGreen,
        );
      }

      if (!brief && !m.over && !m.goal) {
        if (m.countdown > 0) {
          mid(400, 90, Math.ceil(m.countdown / 30), 78, hudGreen);
        }

        if (m.overlay < 100) {
          const a = Math.floor((255 * (100 - m.overlay)) / 100);
          const oc = font.outlineColor;

          font.outlineColor = Color.new(255, 255, 255, a);

          mid(
            400,
            200,
            m.overlayText || m.score[0] + ' - ' + m.score[1],
            84,
            Color.new(0, 50, 0, a),
          );

          font.outlineColor = oc;
        }
      }

      for (const n of ['barMousebreaker', 'barKchamp']) {
        picture(n, ART[n].x, ART[n].y, ART[n].w / 0.8, ART[n].h / 0.8);
      }

      {
        const o = font.outline;

        font.outline = 0;
        mid(74, 497, 'D-PAD - MOVE', 20, white);
        mid(74, 525, 'SQUARE - KICK', 20, white);
        mid(223, 501, m.timeMode ? '1 MINUTE' : 'FIRST TO', 19, white);
        mid(223, 522, m.timeMode ? 'TIMED GAME' : '7 WINS!', 19, white);
        font.outline = o;
      }

      const bp = sim.pos(sim.ball);
      const radius = 5 + 5 * sim.ballSize;

      if (!brief) {
        sprite(
          'ball' + (sim.bouncy === 0 ? 3 : sim.bouncy === 2 ? 2 : 1),
          bp.x,
          bp.y,
          radius / 10,
          false,
          sim.ball.getAngle(),
        );
      }

      for (let i = 0; i < 2; i++) {
        const p = sim.players[i];
        const pos = sim.pos(p.body);
        const foot = sim.pos(p.foot);
        const face = i === 0 ? (multi ? data.face : level) : multi ? face2 : data.face;

        head(face, pos.x, pos.y, p.size, i === 1);

        if (p.freeze) {
          sprite('heroBase2', pos.x, pos.y, p.size);
        }

        if (p.bombed) {
          sprite('heroBase3', pos.x, pos.y, p.size);
        }

        if (p.speedPU !== 1) {
          sprite(
            'speedBolt' + (p.speedPU === 2 ? 2 : 3),
            pos.x + 12 * p.size,
            pos.y + 3 * p.size,
            p.size,
          );
        }

        sprite(
          p.broken ? (i ? 'footRBroken' : 'footLBroken') : i ? 'footR' : 'footL',
          foot.x,
          foot.y,
          p.size,
          false,
          p.foot.getAngle() + Math.PI,
        );
      }

      if (sim.streaker) {
        const p = sim.pos(sim.streaker.body);

        sprite('streaker', p.x, p.y);
      }

      for (const pu of sim.powers) {
        sprite('badge' + ART['pu' + pu.type].ring + (((600 - pu.life) % 30) + 1), pu.x, pu.y);
        sprite('pu' + pu.type, pu.x, pu.y);
      }

      for (const bomb of sim.bombs) {
        sprite('bomb', bomb.x, bomb.y);
      }

      for (const e of sim.effects) {
        sprite('explosion' + (21 - e.life), e.x, e.y);
      }

      sprite(
        'goal' + (sim.goalHeights[0] === 305 ? 2 : sim.goalHeights[0] === 385 ? 3 : 1),
        0,
        340,
      );

      sprite(
        'goal' + (sim.goalHeights[1] === 305 ? 2 : sim.goalHeights[1] === 385 ? 3 : 1),
        800,
        340,
        1,
        true,
      );

      sprite('menuInGame', 736, 508.2);
      sprite(data.music ? 'gameMusicOn' : 'gameMusicOff', 747, 489, 0.325);
      sprite(data.sfx ? 'gameSfxOn' : 'gameSfxOff', 772, 489, 0.5);

      if (multi && m.over) {
        sprite(
          m.winner === 0 ? 'playerWins1' : m.winner === 1 ? 'playerWins2' : 'playerWins3',
          400,
          40,
        );
      } else if (m.over) {
        sprite('goalWords2', 400, 80);
      } else if (suddenTicks > 0) {
        sprite('goalWords3', 400, 80);
      } else if (m.goal) {
        sprite('goalWords1', 400, 80);
      }

      if (ach && ach.t < 200) {
        const a = ART['achAward' + ach.id];
        const alpha = ach.t < 100 ? 128 : Math.floor((128 * (200 - ach.t)) / 100);

        picture(
          'achAward' + ach.id,
          10 - a.ox,
          10 - a.oy,
          a.w / 0.8,
          a.h / 0.8,
          false,
          0,
          Color.new(128, 128, 128, alpha),
        );
      }

      if (brief) {
        picture(multi ? 'brief3' : m.timeMode ? 'brief1' : 'brief2', 165, 60, 472, 162);

        if (multi) {
          const ink = Color.new(56, 56, 56);

          printStyle(
            400,
            81,
            'PLAYER WITH MOST GOALS AFTER 2 MINUTES WINS!',
            15,
            ink,
            true,
            0,
            black,
          );

          printStyle(284, 109, 'PLAYER 1', 13, ink, true, 0, black);
          printStyle(516, 109, 'PLAYER 2', 13, ink, true, 0, black);
          printStyle(284, 127, 'D-PAD / LEFT STICK: MOVE', 12, ink, true, 0, black);
          printStyle(516, 127, 'D-PAD / LEFT STICK: MOVE', 12, ink, true, 0, black);
          printStyle(284, 144, 'X: JUMP   SQUARE / R1: KICK', 12, ink, true, 0, black);
          printStyle(516, 144, 'X: JUMP   SQUARE / R1: KICK', 12, ink, true, 0, black);
          printStyle(400, 201, 'X / START: KICK OFF', 14, ink, true, 0, black);
        } else {
          printStyle(400, 176, 'X / START: KICK OFF', 18, Color.new(56, 56, 56), true, 0, black);
        }
      }
    }

    screen = targetScreen;
    cursor = targetCursor;

    if (splashLive && screen !== 'splash' && transitionTicks === 0) {
      splashLive = false;

      for (const key of Object.keys(textures)) {
        if (key.startsWith('mbIntro') || key === 'splash') {
          textures[key].free();
          delete textures[key];
        }
      }
    }
  }

  Loop.run(
    {
      update,
      draw,
    },
    {
      fixedStep: 1 / 30,
      maxSteps: 3,
      maxDelta: 0.1,
    },
  );
}

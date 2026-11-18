export const NAMES = [
  'Wine Runey',
  'Rude Gullsnest',
  'Cristiano Rollover',
  'Zizu Top',
  'Michel La-Tiny',
  'Ronald O',
  'Roberto Badgero',
  'Eric Canteena',
  'Mary Donna',
  'Peely',
];

export const PU_NAMES = [
  'Super Speed',
  'Slow Speed',
  'Super Jump',
  'Low Jump',
  'Freeze',
  'Freeze',
  'Big Goal',
  'Small Goal',
  'Bombs',
  'Big Ball',
  'Bouncy Ball',
  'Small Ball',
  'Dead Ball',
  null,
  null,
  null,
  null,
  null,
];

export function newMatch(level = 1, multi = false) {
  return {
    level,
    multi,
    score: [0, 0],
    timeMode: !!(level % 2),
    ticks: 0,
    time: 60,
    sudden: false,
    goal: 0,
    over: false,
    winner: -1,
    age: 0,
    flash: 1000,
  };
}

export function finish(m) {
  m.over = true;
  m.winner = m.score[0] > m.score[1] ? 0 : m.score[1] > m.score[0] ? 1 : -1;
}

export function tickClock(m) {
  if (m.over) {
    return;
  }

  m.age++;

  if (m.goal > 0) {
    m.goal--;

    return;
  }

  if (m.timeMode && ++m.ticks >= 40) {
    m.ticks = 0;
    m.time = Math.max(0, m.time - 1);

    if (m.time === 0) {
      if (m.score[0] === m.score[1]) {
        m.sudden = true;
      } else {
        finish(m);
      }
    }
  }
}

export function scoreGoal(m, side) {
  if (m.over || m.goal) {
    return false;
  }

  m.score[side]++;

  if (m.sudden || (!m.timeMode && m.score[side] >= 7)) {
    finish(m);
  } else {
    m.goal = 15;
  }

  return true;
}

export function aiControl(level, age, ball, p, footAngle, lastUp) {
  let cap = age < 500 ? 400 : age < 1000 ? 500 : age < 1500 ? 600 : 700;

  if (level % 3) {
    cap = 1000;
  }

  let move = 0;

  if (ball.x < p.x + 20 && p.x > 75 && ball.x < cap) {
    move--;
  }

  if (footAngle < 0.4 && ball.y > p.y - 20 && ball.x < p.x + 70 && ball.x > p.x) {
    move--;
  } else if (ball.x > p.x + 25 && ball.x < cap) {
    move++;
  }

  return {
    move,
    jump: ball.x < p.x || (ball.x < p.x + 80 && ball.y < p.y - 30 && ball.vx < 0),
    kick: ball.y > p.y - 20 && ball.x < p.x + 70 && ball.x > p.x && !lastUp,
  };
}

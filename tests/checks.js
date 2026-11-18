import { newMatch, tickClock, scoreGoal, aiControl } from '../game/rules.js';
import { LEVELS } from '../game/levels.js';

export function checkRules() {
  let count = 0;

  const check = (ok, msg) => {
    if (!ok) {
      throw new Error('SHF_TEST_FAIL ' + msg);
    }

    count++;
  };

  for (let level = 1; level <= 10; level++) {
    const m = newMatch(level);

    check(m.timeMode === !!(level % 2), 'alternating match ' + level);
  }

  let m = newMatch();

  for (let i = 0; i < 39; i++) {
    tickClock(m);
  }

  check(m.time === 60, 'clock waits for forty updates');
  tickClock(m);
  check(m.time === 59, 'source clock cadence');
  m = newMatch();
  m.score = [1, 0];

  for (let i = 0; i < 2400; i++) {
    tickClock(m);
  }

  check(m.over && m.winner === 0, 'timed result left');
  m = newMatch();

  for (let i = 0; i < 2400; i++) {
    tickClock(m);
  }

  check(m.sudden && !m.over, 'tied timer sudden death');
  scoreGoal(m, 1);
  check(m.over && m.winner === 1, 'sudden death winner');
  m = newMatch(2);

  for (let i = 0; i < 6; i++) {
    scoreGoal(m, 0);

    for (let j = 0; j < 15; j++) {
      tickClock(m);
    }
  }

  check(!m.over && m.score[0] === 6, 'six goals is not victory');
  scoreGoal(m, 0);
  check(m.over && m.winner === 0, 'seven goals wins');
  check(!scoreGoal(m, 1), 'no scoring after finish');
  m = newMatch();
  check(scoreGoal(m, 1), 'initial goal');
  check(!scoreGoal(m, 1) && m.score[1] === 1, 'goal cannot count twice');

  for (let i = 0; i < 15; i++) {
    tickClock(m);
  }

  check(scoreGoal(m, 0), 'restart allows scoring');
  m = newMatch(2);

  for (let i = 0; i < 4000; i++) {
    tickClock(m);
  }

  check(!m.over, 'untimed match stays active');
  check(LEVELS.length === 10, 'ten blueprints');
  check(LEVELS[0].length === 0, 'initial arena empty');
  check(LEVELS[1][0].x === 400 && LEVELS[1][0].w === 79, 'second blueprint exact radius');

  check(
    aiControl(
      3,
      0,
      {
        x: 500,
        y: 200,
        vx: 0,
      },
      {
        x: 200,
        y: 440,
      },
      1,
      false,
    ).move === 0,
    'defensive AI cap',
  );

  check(
    aiControl(
      2,
      0,
      {
        x: 500,
        y: 200,
        vx: 0,
      },
      {
        x: 200,
        y: 440,
      },
      1,
      false,
    ).move > 0,
    'other AI pursues',
  );

  check(
    aiControl(
      3,
      1600,
      {
        x: 650,
        y: 200,
        vx: 0,
      },
      {
        x: 200,
        y: 440,
      },
      1,
      false,
    ).move > 0,
    'AI cap grows',
  );

  console.log('SHF_CHECK rules ' + count);

  return count;
}

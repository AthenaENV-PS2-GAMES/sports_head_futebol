import * as std from 'std';

const PATH = 'mc0:/SPORTSHEADS/save.json';

export function createStore() {
  const data = {
    version: 1,
    face: 1,
    wins: Array(10).fill(false),
    scores: Array.from(
      {
        length: 10,
      },
      () => [0, 0],
    ),
    achievements: Array(17).fill(false),
    music: true,
    sfx: true,
  };

  let available = false;
  let hasSave = false;
  let job = null;
  let pending = false;

  try {
    available = MemoryCard.getInfo(0).connected;

    if (available && MemoryCard.exists(PATH)) {
      const d = MemoryCard.readJSON(PATH);

      if (d && d.version === 1) {
        hasSave = true;

        if (Number.isInteger(d.face) && d.face >= 1 && d.face <= 10) {
          data.face = d.face;
        }

        if (Array.isArray(d.wins) && d.wins.length === 10) {
          data.wins = d.wins.map((x) => x === true);
        }

        if (Array.isArray(d.achievements) && d.achievements.length === 17) {
          data.achievements = d.achievements.map((x) => x === true);
        }

        if (Array.isArray(d.scores) && d.scores.length === 10) {
          data.scores = d.scores.map((x) =>
            Array.isArray(x) &&
            x.length === 2 &&
            x.every((n) => Number.isInteger(n) && n >= 0 && n < 1000)
              ? x
              : [0, 0],
          );
        }

        if (typeof d.music === 'boolean') {
          data.music = d.music;
        }

        if (typeof d.sfx === 'boolean') {
          data.sfx = d.sfx;
        }
      }
    }
  } catch (e) {}

  function save() {
    if (job) {
      pending = true;

      return;
    }

    try {
      available = MemoryCard.getInfo(0).connected;

      if (!available) {
        return;
      }

      hasSave = true;

      if (!MemoryCard.exists('mc0:/SPORTSHEADS')) {
        MemoryCard.mkdir('mc0:/SPORTSHEADS');
      }

      if (!MemoryCard.exists('mc0:/SPORTSHEADS/icon.sys')) {
        const f = std.open('assets/save/icon.ico', 'rb');

        if (f) {
          f.seek(0, std.SEEK_END);

          const bytes = new ArrayBuffer(f.tell());

          f.seek(0, std.SEEK_SET);
          f.read(bytes, 0, bytes.byteLength);
          f.close();
          MemoryCard.writeFile('mc0:/SPORTSHEADS/icon.ico', bytes);

          MemoryCard.writeFile(
            'mc0:/SPORTSHEADS/icon.sys',
            MemoryCard.createIconSys({
              title: 'Sports Heads\nFootball',
              icon: 'icon.ico',
            }),
          );
        }
      }

      job = MemoryCard.writeJSONAsync(PATH, JSON.parse(JSON.stringify(data)), {
        atomic: true,
      });
    } catch (e) {}
  }

  return {
    data,
    save,
    get available() {
      return available;
    },
    get hasSave() {
      return hasSave;
    },
    poll() {
      if (!job) {
        return;
      }

      const s = MemoryCard.poll(job);

      if (s.state === 'running') {
        return;
      }

      job = null;

      if (pending) {
        pending = false;
        save();
      }
    },
  };
}

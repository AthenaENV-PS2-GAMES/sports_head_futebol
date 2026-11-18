#!/usr/bin/env python3
import argparse, json, struct, subprocess, zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()

p.add_argument("--node", default="node")

a = p.parse_args()
src = ROOT / "reference/export/sounds"
out = ROOT / "assets/audio"

out.mkdir(exist_ok=True)

import os

raw = Path(os.environ.get("SHF_SWF", ROOT / "assets/Sports_Heads_Football.swf")).read_bytes()
swf = raw[:8] + zlib.decompress(raw[8:]) if raw[:3] == b"CWS" else raw
inventory = json.loads((ROOT / "analysis/swf_inventory.json").read_text())
sounds = {s["id"]: s for s in inventory["sounds"]}


def convert(source, target):
    sid = int(source.stem.split("_", 1)[0])
    s = sounds[sid]
    off = s["offset"]
    header = struct.unpack_from("<H", swf, off)[0]
    body = off + (6 if (header & 63) == 63 else 2)
    seek = struct.unpack_from("<h", swf, body + 7)[0]

    assert seek >= 0 and s["codec"] == 2, "Unexpected SWF MP3 layout"

    trim = f"atrim=start_sample={seek}:end_sample={seek + s['samples']},asetpts=PTS-STARTPTS"

    subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-y",
            "-i",
            str(source),
            "-af",
            trim,
            "-ar",
            "22050",
            "-ac",
            "1",
            str(target),
        ],
        check=True,
    )


for name in ["kick", "jump", "pop", "coin", "whistle", "cheer", "explosion", "die"]:
    source = next(src.glob("*_" + name.capitalize() + "Sound.mp3"))

    convert(source, out / (name + ".wav"))

    subprocess.run(
        [
            a.node,
            str(ROOT.parents[2] / "tools/wav2adp.js"),
            str(out / (name + ".wav")),
            str(out / (name + ".adp")),
        ],
        check=True,
    )

convert(src / "175.mp3", out / "intro.wav")

subprocess.run(
    [
        a.node,
        str(ROOT.parents[2] / "tools/wav2adp.js"),
        str(out / "intro.wav"),
        str(out / "intro.adp"),
    ],
    check=True,
)

convert(src / "2_LoopSound2.mp3", out / "music.wav")
convert(src / "1_LoopSound.mp3", out / "music_layer.wav")

subprocess.run(
    [
        a.node,
        str(ROOT.parents[2] / "tools/wav2adp.js"),
        "-L",
        str(out / "music_layer.wav"),
        str(out / "music_layer.adp"),
    ],
    check=True,
)

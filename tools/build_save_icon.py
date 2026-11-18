#!/usr/bin/env python3
from pathlib import Path
import json
import struct
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCALE = 3.8 / 124


def main():
    mesh = json.loads((ROOT / "tools/icon_mesh.json").read_text())
    body = b""
    count = 0

    for tri in mesh:
        pts = [(v["p"][0] * SCALE, -v["p"][1] * SCALE, v["p"][2] * SCALE) for v in tri["v"]]
        uvs = [(v["uv"][0] * 128, (1 - v["uv"][1]) * 128) for v in tri["v"]]
        n = (tri["n"][0], -tri["n"][1], tri["n"][2])
        ab = [pts[1][k] - pts[0][k] for k in range(3)]
        ac = [pts[2][k] - pts[0][k] for k in range(3)]

        face = (
            ab[1] * ac[2] - ab[2] * ac[1],
            ab[2] * ac[0] - ab[0] * ac[2],
            ab[0] * ac[1] - ab[1] * ac[0],
        )

        order = [0, 1, 2] if sum((face[k] * n[k] for k in range(3))) >= 0 else [0, 2, 1]

        for i in order:
            body += struct.pack("<4h", *[round(c * 4096) for c in pts[i]], 4096)

            body += struct.pack(
                "<4h2h4B",
                *[round(c * 4096) for c in n],
                4096,
                round(uvs[i][0] * 32),
                round(uvs[i][1] * 32),
                128,
                128,
                128,
                128
            )

            count += 1

    texture = Image.open(ROOT / "tools/blender/icon-texture.png").convert("RGB")
    payload = struct.pack("<5I", 65536, 1, 7, 1065353216, count) + body
    payload += struct.pack("<IIfII", 1, 1, 1.0, 0, 1) + struct.pack("<IIff", 0, 1, 1.0, 1.0)

    for r, g, b in texture.getdata():
        payload += struct.pack("<H", (r >> 3) | ((g >> 3) << 5) | ((b >> 3) << 10) | 0x8000)

    (ROOT / "assets/save/icon.ico").write_bytes(payload)
    print("PS2 icon", len(payload), "bytes,", count, "vertices")


if __name__ == "__main__":
    main()

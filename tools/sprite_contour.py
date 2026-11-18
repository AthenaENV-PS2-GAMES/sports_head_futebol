#!/usr/bin/env python3
from pathlib import Path
import json, math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
THRESHOLD = 40
EPS = 0.6
S = 3


def boundary_loops(mask, w, h):
    edges = {}

    for y in range(h):
        for x in range(w):
            if not mask[y][x]:
                continue

            if y == 0 or not mask[y - 1][x]:
                edges.setdefault((x, y), []).append((x + 1, y))

            if x == w - 1 or not mask[y][x + 1]:
                edges.setdefault((x + 1, y), []).append((x + 1, y + 1))

            if y == h - 1 or not mask[y + 1][x]:
                edges.setdefault((x + 1, y + 1), []).append((x, y + 1))

            if x == 0 or not mask[y][x - 1]:
                edges.setdefault((x, y + 1), []).append((x, y))

    loops = []

    while edges:
        start = next(iter(edges))
        loop = [start]
        cur = start
        prev = None

        while True:
            opts = edges[cur]

            if len(opts) > 1 and prev is not None:
                opts.sort(key=lambda n: prev[0] * (n[1] - cur[1]) - prev[1] * (n[0] - cur[0]))

            nxt = opts.pop(0)

            if not opts:
                del edges[cur]

            prev = (nxt[0] - cur[0], nxt[1] - cur[1])
            cur = nxt

            if cur == start:
                break

            loop.append(cur)

        loops.append(loop)

    return loops


def simplify(points, eps):

    def dp(pts):
        if len(pts) < 3:
            return pts

        a, b = (pts[0], pts[-1])
        dx, dy = (b[0] - a[0], b[1] - a[1])
        L = math.hypot(dx, dy)
        best, idx = (-1, 0)

        for i in range(1, len(pts) - 1):
            p = pts[i]

            d = (
                math.hypot(p[0] - a[0], p[1] - a[1])
                if L == 0
                else abs(dx * (a[1] - p[1]) - (a[0] - p[0]) * dy) / L
            )

            if d > best:
                best, idx = (d, i)

        if best > eps:
            return dp(pts[: idx + 1])[:-1] + dp(pts[idx:])

        return [a, b]

    far = max(
        range(len(points)),
        key=lambda i: math.hypot(points[i][0] - points[0][0], points[i][1] - points[0][1]),
    )

    r = points[far:] + points[:far]
    half = len(r) // 2

    return dp(r[: half + 1])[:-1] + dp(r[half:] + [r[0]])[:-1]


def area(l):
    return (
        sum(
            (
                l[i][0] * l[(i + 1) % len(l)][1] - l[(i + 1) % len(l)][0] * l[i][1]
                for i in range(len(l))
            )
        )
        / 2
    )


im = Image.open(ROOT / "assets/flash/head1.png").convert("RGBA")
box = im.getchannel("A").point(lambda v: 255 if v >= THRESHOLD else 0).getbbox()
cut = im.crop(box)
w, h = cut.size
mask = [[cut.getpixel((x, y))[3] >= THRESHOLD for x in range(w)] for y in range(h)]
loops = [simplify(l, EPS) for l in boundary_loops(mask, w, h)]
loops = [l for l in loops if len(l) >= 3 and abs(area(l)) >= 2]
big = cut.resize((w * S, h * S), Image.Resampling.NEAREST)
tex = Image.new("RGBA", (128, 128), (28, 22, 18, 255))
ox, oy = ((128 - w * S) // 2, (128 - h * S) // 2)
under = Image.new("RGBA", big.size, (28, 22, 18, 255))

under.alpha_composite(big)
tex.paste(under, (ox, oy))
tex.convert("RGB").save(ROOT / "tools/blender/icon-texture.png")

out = [[[ox + px * S - 64, oy + py * S - 64] for px, py in l] for l in loops]

(ROOT / "tools/blender").mkdir(exist_ok=True)
(ROOT / "tools/blender/head1_contour.json").write_text(json.dumps(out))
print("sprite", cut.size, "loops", [len(l) for l in out])

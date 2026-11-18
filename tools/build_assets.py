#!/usr/bin/env python3
from pathlib import Path
import json, math, re, xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageChops, ImageFilter
from svg_render import render

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "reference/vector"
OUT = ROOT / "assets/flash"

OUT.mkdir(exist_ok=True)

CID = "{https://www.free-decompiler.com/flash}characterId"


def sprite(cid, frame=1):
    return (
        next(
            (SRC / "sprites").glob(f"DefineSprite_{cid}_*"), SRC / "sprites" / f"DefineSprite_{cid}"
        )
        / f"{frame}.svg"
    )


def save(im, name, smooth=False, colors=256):
    method = Image.Quantize.LIBIMAGEQUANT if smooth else Image.Quantize.FASTOCTREE

    im.quantize(colors=colors, method=method).save(OUT / (name + ".png"))


def art(path, name, keep=None, remove_chars=(), margin=0):
    tree = ET.parse(path)

    if margin:
        r = tree.getroot()

        for k in ("width", "height"):
            r.set(k, str(float(r.get(k).replace("px", "")) + 2 * margin) + "px")

        g = r[0]
        t = [float(v) for v in re.findall("-?\\d+(?:\\.\\d+)?", g.get("transform"))]
        t[4] += margin
        t[5] += margin

        g.set("transform", "matrix(" + ", ".join(map(str, t)) + ")")

    for n in tree.getroot().iter():
        for child in list(n):
            if child.get(CID) == "100" or child.get(CID) in remove_chars:
                n.remove(child)

    if keep is not None:
        group = tree.getroot()[0]

        for n in list(group):
            if n.tag.endswith("use") and (not keep(n)):
                group.remove(n)

    tmp = OUT / "source.svg"

    tree.write(tmp)

    im, origin = render(tmp, 0.8, tmp=OUT / "render.svg")

    if name in ["menu", "levels", "field"]:
        strip = Image.open(ROOT / "reference/export/images/93.png").convert("RGBA")
        top, height = (368, 16) if name == "field" else (384, 48)
        layer = Image.new("RGBA", im.size, (0, 0, 0, 0))

        layer.alpha_composite(strip.resize((640, height), Image.Resampling.LANCZOS), (0, top))

        blur = (
            layer.getchannel("A")
            .filter(ImageFilter.GaussianBlur(2.87 * 0.8))
            .filter(ImageFilter.GaussianBlur(2.87 * 0.8))
        )

        shadow = Image.new("RGBA", im.size, (0, 0, 0, 255))

        shadow.putalpha(blur.point(lambda v: v // 2))
        im.alpha_composite(shadow)
        im.alpha_composite(layer)

    save(im, name, smooth=bool(margin))
    tmp.unlink()

    return dict(w=im.width, h=im.height, ox=origin[0], oy=origin[1])


def animation(directory, name, frames, hole=True):
    out = {}

    for frame in range(1, frames + 1):
        path = directory / f"{frame}.svg"

        if not hole:
            tree = ET.parse(path)
            r = tree.getroot()

            for k in ("width", "height"):
                r.set(k, str(float(r.get(k).replace("px", "")) + 24) + "px")

            g = r[0]
            t = [float(v) for v in re.findall("-?\\d+(?:\\.\\d+)?", g.get("transform"))]
            t[4] += 12
            t[5] += 12

            g.set("transform", "matrix(" + ", ".join(map(str, t)) + ")")

            path = OUT / "padded.svg"

            tree.write(path)

        im, origin = render(path, 0.8, tmp=OUT / "animation.svg")

        if hole and name.startswith("ring"):
            hole = Image.new("L", im.size, 255)

            ImageDraw.Draw(hole).ellipse((13, 13, 43, 43), fill=0)
            im.putalpha(ImageChops.multiply(im.getchannel("A"), hole))

        save(im, f"{name}{frame}", smooth=not hole)

        out[frame] = dict(w=im.width, h=im.height, ox=origin[0], oy=origin[1])

    return out


def light_tint(name, smooth=False):
    src = Image.open(OUT / (name + ".png")).convert("RGBA")
    rgb = Image.blend(src.convert("RGB"), Image.new("RGB", src.size, (255, 255, 255)), 0.5)

    rgb.putalpha(src.getchannel("A"))
    save(rgb, name + "Hover", smooth=smooth)


def menu_button(path, name, char_id, reg_x, reg_y, hover=True):
    tree = ET.parse(path)
    root = tree.getroot()
    group = root[0]

    for child in list(group):
        if child.tag.endswith("rect"):
            group.remove(child)
        elif child.tag.endswith("use") and child.get(CID) != str(char_id):
            group.remove(child)

    tmp = OUT / "menu-button.svg"

    tree.write(tmp)

    im, _ = render(tmp, 0.8, tmp=OUT / "menu-button-render.svg")

    tmp.unlink()

    box = im.getchannel("A").getbbox()

    if not box:
        raise ValueError(f"Empty menu button {name}")

    im = im.crop(box)

    save(im, name)

    if hover:
        light_tint(name)

    return dict(
        w=im.width, h=im.height, ox=(reg_x * 0.8 - box[0]) / 0.8, oy=(reg_y * 0.8 - box[1]) / 0.8
    )


def frame_piece(path, name, char_id):
    tree = ET.parse(path)
    group = tree.getroot()[0]

    for child in list(group):
        if not child.tag.endswith("use") or child.get(CID) != str(char_id):
            group.remove(child)

    tmp = OUT / "piece.svg"

    tree.write(tmp)

    im, _ = render(tmp, 0.8, tmp=OUT / "piece-render.svg")

    tmp.unlink()

    box = im.getchannel("A").getbbox()

    if not box:
        raise ValueError("Empty frame piece " + name)

    save(im.crop(box), name, smooth=True)

    return dict(
        w=box[2] - box[0], h=box[3] - box[1], ox=0.0, oy=0.0, x=box[0] / 0.8, y=box[1] / 0.8
    )


meta = {}

art(
    SRC / "frames/5.svg",
    "menu",
    lambda n: n.get(CID)
    not in ["302", "308", "317", "287", "290", "283", "293", "298", "300", "296"],
)

art(
    SRC / "frames/14.svg",
    "levels",
    lambda n: n.get(CID) not in ["287", "290", "323", "331", "358", "262"],
)

art(SRC / "frames/23.svg", "field", lambda n: n.get(CID) in ["152", "280", "359", "100"])
art(SRC / "frames/2.svg", "splash", remove_chars=["197"])
art(SRC / "frames/4.svg", "instructions", remove_chars=["225"])
art(sprite(317), "choose", remove_chars=["262"])

meta["menuInGame"] = art(sprite(367), "menuInGame")

for cid, name in [(287, "sfx"), (290, "music")]:
    meta[name + "On"] = art(sprite(cid, 1), name + "On")
    meta[name + "Off"] = art(sprite(cid, 2), name + "Off")

for n in ["sfxOn", "sfxOff", "musicOn", "musicOff"]:
    src_im = Image.open(OUT / (n + ".png")).convert("RGBA")
    white = Image.new("RGBA", src_im.size, (255, 255, 255, 255))

    white.putalpha(src_im.getchannel("A"))
    white.save(OUT / ("game" + n[0].upper() + n[1:] + ".png"))

    meta["game" + n[0].upper() + n[1:]] = meta[n]

art(sprite(358), "achievementScreen", remove_chars=["347"])

meta["badgeOff"] = art(sprite(347, 1), "badgeOff")
meta["badgeOn"] = art(sprite(347, 2), "badgeOn")

for cid, name, x, y in [
    (283, "newGame", 400, 160.5),
    (293, "continueGame", 400, 230.5),
    (300, "twoPlayer", 300, 275.5),
    (298, "menuInstructions", 400, 345.5),
]:
    meta[name] = menu_button(SRC / "frames/5.svg", name, cid, x, y)
    meta[name + "Hover"] = meta[name].copy()

for cid, name, count in [
    (110, "ringGreen", 30),
    (104, "ringRed", 30),
    (119, "ringYellow", 30),
    (296, "menuBall", 48),
]:
    d = next(SRC.joinpath("sprites").glob(f"DefineSprite_{cid}*"))
    seq = animation(d, name, count)

    meta.update({f"{name}{i}": v for i, v in seq.items()})

for cid, name, x in [
    (335, "levelMenu", 7),
    (326, "levelInstructions", 272),
    (328, "levelAchievements", 382),
]:
    meta[name] = menu_button(SRC / "frames/14.svg", name, cid, x, 489.5)
    meta[name + "Hover"] = meta[name].copy()

for i in range(1, 4):
    meta[f"levelbox{i}"] = art(
        sprite(323, i), f"levelbox{i}", remove_chars=["320", "321", "322"], margin=24
    )

    light_tint(f"levelbox{i}", smooth=True)

    meta[f"levelbox{i}Hover"] = meta[f"levelbox{i}"].copy()

for i in range(1, 18):
    meta[f"achAward{i}"] = art(sprite(224, i), f"achAward{i}")

meta["brief1"] = art(sprite(428, 1), "brief1", remove_chars=["417"])
meta["brief2"] = art(sprite(428, 2), "brief2", remove_chars=["419"])

meta["brief3"] = art(
    sprite(428, 3), "brief3", remove_chars=["419", "421", "422", "423", "424", "425", "426", "427"]
)

for i in range(1, 4):
    meta[f"goalWords{i}"] = art(sprite(402, i), f"goalWords{i}")

for i in range(1, 4):
    meta[f"playerWins{i}"] = art(sprite(408, i), f"playerWins{i}")

meta["heads"] = [art(sprite(262, i), f"head{i}") for i in range(1, 11)]

for cid, name in [(128, "goal"), (265, "footR"), (268, "footL"), (75, "ball"), (122, "streaker")]:
    meta[name] = art(sprite(cid), name)

meta["footRBroken"] = art(sprite(265, 2), "footRBroken")
meta["footLBroken"] = art(sprite(268, 2), "footLBroken")

for cid, name, frames in [(66, "heroBase", 3), (69, "speedBolt", 3)]:
    for i in range(2 if name == "heroBase" else 1, frames + 1):
        meta[f"{name}{i}"] = art(sprite(cid, i), f"{name}{i}")

for i in range(1, 4):
    meta[f"goal{i}"] = art(sprite(128, i), f"goal{i}")

for i in range(1, 4):
    meta[f"ball{i}"] = art(sprite(74, i), f"ball{i}")

_intro = next((SRC / "sprites").glob("DefineSprite_197_*"))
_boom = next((SRC / "sprites").glob("DefineSprite_178_*"))

for i in range(1, 209):
    im, origin = render(_intro / f"{i}.svg", 0.8, remove_chars=("178",), tmp=OUT / "animation.svg")
    k = i - 44

    if 2 <= k <= 18:
        boom, bo = render(_boom / f"{k}.svg", 0.8, tmp=OUT / "animation.svg")
        px = round((origin[0] + 10 - bo[0]) * 0.8)
        py = round((origin[1] + 7 - bo[1]) * 0.8)

        (
            im.alpha_composite(boom, (px, py))
            if px >= 0 and py >= 0
            else im.alpha_composite(
                boom.crop((max(0, -px), max(0, -py), boom.width, boom.height)),
                (max(px, 0), max(py, 0)),
            )
        )

    save(im, f"mbIntro{i}", smooth=True, colors=64)

meta["mbIntro"] = dict(w=im.width, h=im.height, ox=origin[0], oy=origin[1], frames=208)
meta["bomb"] = art(sprite(61), "bomb")
meta["flasher"] = art(sprite(432), "flasher")
meta["barMousebreaker"] = frame_piece(SRC / "frames/23.svg", "barMousebreaker", 371)
meta["barKchamp"] = frame_piece(SRC / "frames/23.svg", "barKchamp", 373)
meta["shadow"] = art(sprite(430), "shadow")

for i in range(1, 21):
    meta[f"explosion{i}"] = art(sprite(52, i), f"explosion{i}")

for cid, name, frames in [(92, "ring", 9), (83, "greenRing", 7), (80, "redRing", 7)]:
    for i in range(2 if name == "heroBase" else 1, frames + 1):
        meta[f"{name}{i}"] = art(sprite(cid, i), f"{name}{i}")

for cid, name in [(58, "dust"), (85, "trail")]:
    meta[name] = art(sprite(cid), name)


def walls_composite(level):
    from PIL import ImageFilter

    walls = art(sprite(380, level), f"walls{level}-raw")
    layer = Image.open(OUT / f"walls{level}-raw.png").convert("RGBA")

    (OUT / f"walls{level}-raw.png").unlink()

    tree = ET.parse(sprite(383))
    root = tree.getroot()

    for n in list(root.iter()):
        for child in list(n):
            if child.get(CID) in ("380", "381", "382"):
                n.remove(child)

    tmp = OUT / "scores.svg"

    tree.write(tmp)

    frame, _ = render(tmp, 0.8, tmp=OUT / "scores-render.svg")

    tmp.unlink()

    comp = Image.new("RGBA", layer.size, (0, 0, 0, 0))

    comp.alpha_composite(layer)
    comp.alpha_composite(frame.crop((0, 0) + layer.size))

    a = comp.getchannel("A")

    inner = (
        ImageChops.invert(a)
        .filter(ImageFilter.GaussianBlur(2.87 * 0.8))
        .filter(ImageFilter.GaussianBlur(2.87 * 0.8))
    )

    rim = Image.new("RGBA", comp.size, (153, 153, 153, 255))

    rim.putalpha(ImageChops.multiply(inner, a))

    out = comp.copy()

    out.alpha_composite(rim)
    save(out, f"walls{level}", smooth=True)

    return dict(w=out.width, h=out.height, ox=0.0, oy=0.0)


for i in range(1, 11):
    meta[f"walls{i}"] = walls_composite(i)

for cid, name in [(110, "badgeGreen"), (104, "badgeRed"), (119, "badgeYellow")]:
    seq = animation(
        next(SRC.joinpath("sprites").glob(f"DefineSprite_{cid}*")), name, 30, hole=False
    )

    meta.update({f"{name}{i}": v for i, v in seq.items()})

ids = [148, 147, 144, 143, 140, 139, 130, 129, 136, 133, 132, 124, 131, 115, 114, 111, 106, 123]

for i, cid in enumerate(ids):
    svg = sprite(cid).read_text()

    ring = next(
        (
            n
            for c, n in [("110", "Green"), ("104", "Red"), ("119", "Yellow")]
            if f'characterId="{c}"' in svg
        )
    )

    meta[f"pu{i + 1}"] = art(sprite(cid), f"pu{i + 1}", remove_chars=["110", "104", "119"])
    meta[f"pu{i + 1}"]["ring"] = ring

levels = []

for i in range(1, 11):
    props = []

    for n in ET.parse(sprite(362, i + 1)).getroot()[0]:
        cid = n.get(CID)

        if cid not in ["87", "89"]:
            raise ValueError("Unsupported blueprint " + str(cid))

        a, b, c, d, x, y = map(float, re.findall("-?\\d+(?:\\.\\d+)?", n.get("transform")))

        props.append(
            dict(
                kind="circle" if cid == "89" else "box",
                x=x,
                y=y,
                w=int(math.hypot(a, b) * (60 if cid == "89" else 50)),
                h=int(math.hypot(c, d) * 50),
                angle=math.atan2(b, a),
            )
        )

    levels.append(props)

(ROOT / "game").mkdir(exist_ok=True)

(ROOT / "game/levels.js").write_text(
    "export const LEVELS = " + json.dumps(levels, indent=2) + ";\n"
)

(ROOT / "game/art.js").write_text("export const ART = " + json.dumps(meta, indent=2) + ";\n")
print("Built art and all ten original blueprints.")

import copy
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import cairo
import gi
from PIL import Image

gi.require_version("Rsvg", "2.0")

from gi.repository import Rsvg

XLINK = "{http://www.w3.org/1999/xlink}href"
NUMS = re.compile("-?\\d+(?:\\.\\d+)?")


def render(path, scale, remove_ids=(), remove_chars=(), supersample=4, tmp=None):
    tree = ET.parse(path)
    root = tree.getroot()
    group = list(root)[0]

    for parent in list(root.iter()):
        for node in list(parent):
            if (
                node.attrib.get("id") in remove_ids
                or node.attrib.get("{https://www.free-decompiler.com/flash}characterId")
                in remove_chars
            ):
                parent.remove(node)

    width = float(root.attrib["width"].replace("px", ""))
    height = float(root.attrib["height"].replace("px", ""))
    gx, gy = [float(v) for v in NUMS.findall(group.attrib["transform"])[4:6]]

    ET.register_namespace("", "http://www.w3.org/2000/svg")
    ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
    ET.register_namespace("ffdec", "https://www.free-decompiler.com/flash")

    clean = Path(tmp or path).with_suffix(".clean.svg")

    tree.write(clean, encoding="utf-8", xml_declaration=True)

    handle = Rsvg.Handle.new_from_file(str(clean))
    big = scale * supersample

    surface = cairo.ImageSurface(
        cairo.FORMAT_ARGB32, max(1, int(width * big)), max(1, int(height * big))
    )

    ctx = cairo.Context(surface)

    ctx.scale(big, big)

    viewport = Rsvg.Rectangle()
    viewport.x = viewport.y = 0
    viewport.width, viewport.height = (width, height)

    handle.render_document(ctx, viewport)

    png = clean.with_suffix(".png")

    surface.write_to_png(str(png))

    image = Image.open(png).convert("RGBA")

    small = image.resize(
        (max(1, round(width * scale)), max(1, round(height * scale))), Image.Resampling.LANCZOS
    )

    clean.unlink()
    png.unlink()

    return (small, (gx, gy))

#!/usr/bin/env python3
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct
import zlib


def u16(data, pos):
    return struct.unpack_from("<H", data, pos)[0]


def cstring(data, pos):
    end = data.index(0, pos)

    return (data[pos:end].decode("utf-8", errors="replace"), end + 1)


def rectangle(data, pos):
    start = pos * 8

    def bits(offset, count):
        value = 0

        for bit in range(offset, offset + count):
            value = (value << 1) | ((data[bit // 8] >> (7 - bit % 8)) & 1)

        return value

    width = bits(start, 5)
    values = []

    for i in range(4):
        value = bits(start + 5 + i * width, width)

        if value & (1 << (width - 1)):
            value -= 1 << width

        values.append(value / 20)

    return (values, (start + 5 + 4 * width + 7) // 8)


def inspect(path):
    raw = path.read_bytes()
    signature = raw[:3]

    if signature == b"CWS":
        data = b"FWS" + raw[3:8] + zlib.decompress(raw[8:])
    elif signature == b"FWS":
        data = raw
    else:
        raise ValueError("Only FWS and zlib-compressed CWS supported")

    if len(data) != struct.unpack_from("<I", data, 4)[0]:
        raise ValueError("SWF declared size differs from decoded size")

    rect, pos = rectangle(data, 8)

    report = dict(
        source=str(path),
        sha256=hashlib.sha256(raw).hexdigest(),
        signature=signature.decode(),
        swf_version=raw[3],
        compressed_bytes=len(raw),
        uncompressed_bytes=len(data),
        stage=dict(x_min=rect[0], x_max=rect[1], y_min=rect[2], y_max=rect[3]),
        frame_rate=u16(data, pos) / 256,
        root_frames=u16(data, pos + 2),
        exports=[],
        sprites=[],
        sounds=[],
        bitmaps=[],
        actions=[],
        labels=[],
        constant_pools=[],
        limitations=[
            "Static inventory only; no runtime behavior observed.",
            "Constant pools are strings, not decompiled logic or verified mechanics.",
            "DoInitAction and DoAction inspected; button/clip action event containers not decoded.",
            "Vector shapes, fonts, sounds and images inventoried, not rendered or converted.",
        ],
    )

    counts = Counter()

    def actions(body, base, context, depth=0):
        if depth > 100:
            raise ValueError("Action nesting exceeds limit")

        p = 0

        while p < len(body):
            origin = p
            op = body[p]
            p += 1

            if op == 0:
                break

            size = u16(body, p) if op >= 128 else 0

            if op >= 128:
                p += 2

            end = p + size

            if end > len(body):
                raise ValueError("Action extends beyond container")

            chunk = body[p:end]

            if op == 136:
                q = 2
                strings = []

                for _ in range(u16(chunk, 0)):
                    value, q = cstring(chunk, q)

                    strings.append(value)

                report["constant_pools"].append(
                    dict(offset=base + origin, context=context, strings=strings)
                )

            if op in (155, 142):
                _, q = cstring(chunk, 0)
                argc = u16(chunk, q)
                q += 2

                if op == 142:
                    q += 3

                for _ in range(argc):
                    if op == 142:
                        q += 1

                    _, q = cstring(chunk, q)

                code_size = u16(chunk, q)

                if end + code_size > len(body):
                    raise ValueError("Function body exceeds container")

                actions(body[end : end + code_size], base + end, context, depth + 1)

                end += code_size
            elif op == 148:
                code_size = u16(chunk, 0)

                if end + code_size > len(body):
                    raise ValueError("With body exceeds container")

                actions(body[end : end + code_size], base + end, context, depth + 1)

                end += code_size
            elif op == 143:
                sizes = struct.unpack_from("<HHH", chunk, 1)

                for code_size in sizes:
                    if end + code_size > len(body):
                        raise ValueError("Try body exceeds container")

                    actions(body[end : end + code_size], base + end, context, depth + 1)

                    end += code_size

            p = end

    def tags(start, stop, context, depth=0):
        if depth > 100:
            raise ValueError("Sprite nesting exceeds limit")

        p = start
        frame = 1

        while p < stop:
            origin = p
            header = u16(data, p)
            p += 2
            code, size = (header >> 6, header & 63)

            if size == 63:
                size = struct.unpack_from("<I", data, p)[0]
                p += 4

            end = p + size

            if end > stop:
                raise ValueError("Tag extends beyond container")

            counts[code] += 1
            b = data[p:end]

            if code == 69:
                report["file_attributes"] = struct.unpack_from("<I", b)[0]
            elif code in (56, 76):
                q = 2

                for _ in range(u16(b, 0)):
                    char_id = u16(b, q)
                    name, q = cstring(b, q + 2)

                    report["exports"].append(dict(id=char_id, name=name, tag=code))
            elif code == 39:
                char_id, frames = struct.unpack_from("<HH", b)

                report["sprites"].append(dict(id=char_id, frames=frames, offset=origin))
                tags(p + 4, end, f"sprite:{char_id}", depth + 1)
            elif code == 14:
                flags = b[2]

                report["sounds"].append(
                    dict(
                        id=u16(b, 0),
                        codec=flags >> 4,
                        rate_hz=[5512.5, 11025, 22050, 44100][(flags >> 2) & 3],
                        sample_bits=16 if flags & 2 else 8,
                        channels=2 if flags & 1 else 1,
                        samples=struct.unpack_from("<I", b, 3)[0],
                        bytes=size,
                        offset=origin,
                    )
                )
            elif code in (6, 20, 21, 35, 36, 90):
                report["bitmaps"].append(dict(id=u16(b, 0), tag=code, bytes=size, offset=origin))
            elif code in (12, 59):
                skip = 2 if code == 59 else 0
                where = f"{context}/frame:{frame}"

                report["actions"].append(
                    dict(tag=code, context=where, offset=p + skip, bytes=size - skip)
                )

                actions(b[skip:], p + skip, where)
            elif code == 43:
                report["labels"].append(dict(context=context, frame=frame, name=cstring(b, 0)[0]))
            elif code == 1:
                frame += 1

            p = end

            if code == 0:
                break

    tags(pos + 4, len(data), "root")

    report["tag_counts_recursive"] = dict(sorted(counts.items()))
    report["actionscript"] = "AVM2" if report.get("file_attributes", 0) & 8 else "AVM1"

    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)

    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, required=True)

    args = parser.parse_args()
    result = inspect(args.source)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({k: result[k] for k in ("sha256", "stage", "frame_rate", "actionscript")}))

    print(
        json.dumps(
            {
                k: len(result[k])
                for k in ("exports", "sprites", "sounds", "bitmaps", "actions", "constant_pools")
            }
        )
    )

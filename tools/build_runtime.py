#!/usr/bin/env python3
import argparse, hashlib, json, shutil, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULES = "box2d,loop,cdrom,color,draw,font,gamepad,image,imagelist,iop,memcard,screen,sound,system,timer,usbmass"


def main():
    p = argparse.ArgumentParser()

    p.add_argument("--athena", type=Path, default=ROOT.parents[2])
    p.add_argument("--image", default="athenaenv-build:latest")
    p.add_argument("--node", default="node")

    a = p.parse_args()
    build = Path(tempfile.mkdtemp(prefix="shf-athena-"))

    print(build, flush=True)

    for name in ["src", "iop_modules", "ee_modules", "embed", "tools", "assets"]:
        shutil.copytree(a.athena / name, build / name)

    for file in a.athena.glob("Makefile*"):
        shutil.copy2(file, build / file.name)

    shutil.copy2(a.athena / "catalog.json", build / "catalog.json")
    (build / "bin").mkdir()

    subprocess.run(
        [a.node, str(build / "tools/modules.js"), "configure", "--modules=" + MODULES], check=True
    )

    with (ROOT / "analysis/athena-build.log").open("w") as log:
        subprocess.run(
            [
                "docker",
                "run",
                "--rm",
                "--user",
                "0:0",
                "-v",
                str(build) + ":/src",
                "-w",
                "/src",
                a.image,
                "make",
                "-j4",
            ],
            stdout=log,
            stderr=subprocess.STDOUT,
            check=True,
        )

    shutil.copy2(build / "bin/athena.elf", ROOT / "athena.elf")
    shutil.copy2(build / "Makefile.modules", ROOT / "docs/Makefile.modules")
    print("Built", ROOT / "athena.elf")


if __name__ == "__main__":
    main()

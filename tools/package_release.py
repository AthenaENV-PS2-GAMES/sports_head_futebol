#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, shutil, subprocess, zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist"
GAME = OUT / "SportsHeadsFootball"

GAME.mkdir(parents=True, exist_ok=True)

for name in ["main.js", "athena.elf", "README.md", "LICENSE", "NOTICE"]:
    if (ROOT / name).exists():
        shutil.copy2(ROOT / name, GAME / name)

(GAME / "SYSTEM.CNF").write_text("BOOT2 = cdrom0:\\ATHENA.ELF;1\nVER = 1.00\nVMODE = NTSC\n")
(GAME / "athena.ini").write_text('default_script = "main.js"\naudsrv = true\n')

for folder in ["game", "assets/flash", "assets/audio", "assets/fonts", "assets/save"]:
    target = GAME / folder

    target.mkdir(parents=True, exist_ok=True)

    for f in (ROOT / folder).iterdir():
        if f.is_file() and (
            f.suffix in [".js", ".png", ".ttf", ".adp", ".ico", ".md", ".json", ".modules"]
            or f.name == "music.wav"
        ):
            shutil.copy2(f, target / f.name)

shutil.copy2(ROOT / "athena.elf", GAME / "ATHENA.ELF")
shutil.copy2(GAME / "athena.ini", GAME / "ATHENA.INI")

files = {
    str(p.relative_to(GAME)): hashlib.sha256(p.read_bytes()).hexdigest()
    for p in GAME.rglob("*")
    if p.is_file() and p.name != "manifest.json"
}

(GAME / "manifest.json").write_text(json.dumps(files, indent=2) + "\n")

with zipfile.ZipFile(OUT / "SportsHeadsFootball-PS2.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for p in GAME.rglob("*"):
        if p.is_file():
            z.write(p, Path(GAME.name) / p.relative_to(GAME))

subprocess.run(
    [
        "xorriso",
        "-as",
        "mkisofs",
        "-quiet",
        "-iso-level",
        "3",
        "-allow-lowercase",
        "-full-iso9660-filenames",
        "-V",
        "SPORTSHEADS",
        "-o",
        str(OUT / "SportsHeadsFootball-PS2.iso"),
        str(GAME),
    ],
    check=True,
)

print(OUT / "SportsHeadsFootball-PS2.zip")
print(OUT / "SportsHeadsFootball-PS2.iso")

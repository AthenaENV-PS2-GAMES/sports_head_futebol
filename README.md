# Sports Heads Football - PS2 / AthenaENV

A PlayStation 2 port of Sports Heads Football, rebuilt from the original Flash game. The ELF runs JavaScript on AthenaENV; the art and audio come from the original SWF and the physics run on the native Box2D module.

The SWF itself is not part of this repository. To rebuild the assets, provide your own copy (SHA-256 `d1d3c94dff217f402c26e06e386ed3d831055ebdd58c4ee12d8e81d02347554e`) through `SHF_SWF`.

## Running

Run `athena.elf` with `main.js`, `athena.ini`, `game` and `assets` kept together. On PCSX2, enable HostFS to run the folder directly. `python3 tools/package_release.py` produces a USB folder, a ZIP and a disc image in `dist`.

## Controls

| Action | DualShock 2 |
|---|---|
| Move | D-pad / left stick |
| Jump | X / up |
| Kick | Square / R1 |
| Confirm / start | X / START |
| Pause / resume | START |
| Back / quit while paused | Circle |
| Change head on the selection screen | L1 / R1 |
| Achievements from the opponent selection | Triangle |
| Music / sound effects | L1 / R1 in the menu, L2 / R2 on other screens |
| Leave the match for the selection screen | SELECT |

## Gameplay

- The game opens with the original Mousebreaker intro animation (208 frames, about 7 seconds; X or START skips it), then shows the instructions screen. X or START opens the menu.
- In single player the player stands on the right. In two-player mode P1 is on the left and P2 on the right; each pad picks its own head with left/right and P1 confirms. Disconnecting a pad during a match pauses it.
- There are ten opponents and fields with sequential unlocking, AI, odd-numbered 60-second matches with sudden death, even-numbered matches played to seven goals, 18 power-ups and 17 achievements.
- The menus, level selection, achievements page and match cards use the art from the SWF. The control hints were adapted to the DualShock 2.
- The clock keeps the original's quirk: one second is 40 updates, although the SWF declares 30 FPS. A match runs three physics steps of 1/96 s per update.
- The original ads, external links and online leaderboards were left out.

## Saving

Progress, results, achievements and audio settings are stored in `mc0:/SPORTSHEADS` when a memory card is in slot 1. The game works without a card. "New Game" restarts the current campaign.

The memory card icon is the default head (head 1) extruded into a 3D slab, using the sprite as its texture.

## Binary

`athena.elf` is built from AthenaENV with these modules: `box2d`, `cdrom`, `usbmass`, `graphics`, `color`, `draw`, `thread`, `font`, `gamepad`, `image`, `mutex`, `imagelist`, `iop`, `loop`, `memcard`, `screen`, `sound`, `system` and `timer`. The generated module selection is in `docs/Makefile.modules`.

## Documentation

- [Reverse engineering notes](docs/REVERSE_ENGINEERING.md): which parts were recovered from the SWF, which were adapted, and where fidelity is limited.
- [Fidelity comparison](docs/FIDELITY_DIFF.md): differences found against the original, with screenshots.

## Project layout

| Path | Contents |
|---|---|
| `main.js` | Entry point |
| `game/` | Game code: runtime and rendering, rules, physics, levels, achievements, save data |
| `assets/` | Art, audio, font and the memory card icon extracted or generated from the SWF |
| `tools/` | Asset, audio, icon and packaging pipeline |
| `tests/` | Unit checks for the match rules |
| `docs/` | Reverse engineering notes and fidelity comparison |

## Rebuilding

```sh
# Java 17+ and JPEXS 26.4.0. Set SHF_SWF (path to the SWF), SHF_JPEXS (ffdec.jar) and, if needed, SHF_JAVA.
bash tools/extract_swf.sh

# Python with Pillow, PyGObject, pycairo and librsvg; audio needs ffmpeg and Node.
python3 tools/build_assets.py
python3 tools/prepare_audio.py

# Memory card icon: contour, Blender slab, packaging.
python3 tools/sprite_contour.py
blender --background --python tools/blender/head1_slab.py
python3 tools/build_save_icon.py

# ELF: Node and Docker with the local AthenaENV build image.
python3 tools/build_runtime.py

# Rules checks and distribution.
node tests/run.mjs
python3 tools/package_release.py
```

## Credits and license

Original game: Sports Heads Football by Mousebreaker / kChamp. Music credited in the SWF to Hades. The art, music and sound effects belong to their original authors; this is a non-profit fan port.

The source code in this repository is released under the MIT License (see [LICENSE](LICENSE)). The original game's assets, the font, and AthenaENV are not covered by it; see [NOTICE](NOTICE) for the full attribution and for the terms that apply to each.

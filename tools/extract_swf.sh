#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

SHF_SWF="${SHF_SWF:-assets/Sports_Heads_Football.swf}"
SHF_JAVA="${SHF_JAVA:-java}"

: "${SHF_JPEXS:?set SHF_JPEXS to the path of JPEXS ffdec.jar (26.4.0)}"

if [ ! -f "$SHF_SWF" ]; then
  echo "SWF not found: $SHF_SWF (set SHF_SWF)" >&2
  exit 1
fi

mkdir -p reference/export reference/vector analysis

"$SHF_JAVA" -Djava.awt.headless=true -Duser.home=/tmp/shf-java \
  -jar "$SHF_JPEXS" \
  -export script,image,sound,symbolClass,text \
  reference/export "$SHF_SWF" > analysis/jpexs-export.log 2>&1

"$SHF_JAVA" -Djava.awt.headless=true -Duser.home=/tmp/shf-java \
  -jar "$SHF_JPEXS" \
  -format sprite:svg,frame:svg \
  -export sprite,frame \
  reference/vector "$SHF_SWF" > analysis/jpexs-vector.log 2>&1

python3 tools/inspect_swf.py "$SHF_SWF" --output analysis/swf_inventory.json

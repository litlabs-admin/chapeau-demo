#!/usr/bin/env bash
# Rebuild both Seekworthy launch videos from raw/IMG_1133.MOV.
# Needs: ffmpeg, python3 (numpy, opencv-python-headless, onnxruntime,
# a python3.11 venv at work/enh with torch 2.1.1 + resemble-enhance (+ demucs for
# the reference stems), nara_wpe, pyloudnorm, scipy,
# faster-whisper, librosa), node + playwright (Chromium), and the model
# work/models/rvm_resnet50_fp32.onnx (RobustVideoMatting v1.0.0 release).
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n== %s\n' "$*"; }

if [ ! -f build/src30.mp4 ]; then
  step "conform source to CFR 30 fps"
  mkdir -p build
  ffmpeg -v error -y -i raw/IMG_1133.MOV -vf fps=30 -c:v libx264 -preset fast -crf 10 -g 15 -pix_fmt yuv420p -an build/src30.mp4
  ffmpeg -v error -y -i raw/IMG_1133.MOV -vn -ac 1 -ar 48000 -c:a pcm_s16le build/src.wav
fi

step "cut list";           python3 pipeline/cutlist.py
step "conform A-roll";     python3 pipeline/conform.py
step "word timings";       python3 pipeline/words.py
step "caption data";       python3 pipeline/gfx_data.py
[ -f build/alpha.mkv ] || { step "matte"; python3 pipeline/matte.py; }
step "graphics frames";    node pipeline/capture.cjs --workers 4 --out build/gfx
step "voice restoration";  python3 pipeline/enhance_voice.py
step "sound mix";          python3 pipeline/audio.py
# v2 (Ben in his own room, graded). The v1 cut-out look predates the plate
# track (cards / glass / blur) and is not wired to it yet.
step "composite v2";       python3 pipeline/composite.py v2

step "mux"
mkdir -p exports
ffmpeg -v error -y -i build/v2_picture.mp4 -i build/mix.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart exports/seekworthy-launch-v2-room.mp4
echo exports/seekworthy-launch-v2-room.mp4

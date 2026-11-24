#!/usr/bin/env bash
# Ben's dialogue: phone mic in a lamp-lit room -> clean, present voice.
# 1. Resemble Enhance, denoise-only (word-faithful; its full "enhance" mode was
#    tested and rejected because it changed words, e.g. "a shortlist").
# 2. Corrective EQ: take out the boxy 150-400 Hz build-up, restore presence
#    (2.8 / 5.2 kHz) and air (high shelf), plus a gentle harmonic exciter above
#    3.5 kHz to rebuild the top end the phone codec cut off.
# Needs the isolated env work/enh (python3.11: torch 2.1.1, resemble-enhance).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/enh/in
ffmpeg -v error -y -i build/dialogue_raw.wav -ar 48000 -ac 1 build/enh/in/ben.wav
work/enh/bin/resemble-enhance build/enh/in build/enh/out_denoise --device cpu --denoise_only
ffmpeg -v error -y -i build/enh/out_denoise/ben.wav -af "\
highpass=f=75,\
equalizer=f=140:t=q:w=1.0:g=-2,\
equalizer=f=240:t=q:w=0.9:g=-6,\
equalizer=f=480:t=q:w=1.2:g=-1.5,\
equalizer=f=2800:t=q:w=1.0:g=4,\
equalizer=f=5200:t=q:w=1.0:g=3,\
highshelf=f=7500:g=4,\
aexciter=level_in=1:level_out=1:amount=2.2:drive=6:blend=0:freq=3500:ceil=16000:listen=0" \
  -ar 48000 build/enh/dialogue_enhanced.wav
echo build/enh/dialogue_enhanced.wav

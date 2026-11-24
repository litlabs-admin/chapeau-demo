"""Sound: restored dialogue + "march 2" music bed (ducked) + designed SFX.

Dialogue: Ben's phone-mic take restored with Resemble Enhance (denoise +
enhancement, see pipeline/enhance_voice.sh), then a light broadcast chain.

Music: "march 2" by Ondrosik (Free Music Archive, CC0 1.0). Starts on bar
at 8.73 s so the track's section change lands on the Seekworthy reveal
(edit 26.0 s); one bar-aligned jump (44.21 -> 75.51 s, chosen by
chroma/MFCC similarity) lands the track's own ending on the end card.

SFX: Freesound CC0 sounds (credits in work/audio/fs/CREDITS.txt, copied to
VIDEO.md). Every cue is placed by its loudest point on the visual event it
belongs to; typing gets one keystroke per character as it appears.

Writes build/mix.wav (48 kHz stereo, -14 LUFS integrated, -1 dBTP).
"""
import glob
import json
import os
import subprocess
import sys

import numpy as np

SR = 48000
FPS = 30
FS = "work/audio/fs"
cl = json.load(open("build/cutlist.json"))
words = json.load(open("build/words.json"))
DUR = cl["frames"] / FPS
N = int(DUR * SR)
DIALOGUE = sys.argv[1] if len(sys.argv) > 1 else "build/enh/dialogue_enhanced.wav"


def load(path, ss=None, t=None, af=None, ch=2):
    cmd = ["ffmpeg", "-v", "error"]
    if ss is not None:
        cmd += ["-ss", str(ss)]
    if t is not None:
        cmd += ["-t", str(t)]
    cmd += ["-i", path]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()


def db(x):
    return 10 ** (x / 20)


# ---------------------------------------------------------------- dialogue
# The restoration already removed noise and reverb and rebuilt the top end;
# this is only shaping: rumble out, a little warmth back, gentle level
# control, de-ess, loudness.
dlg = load(DIALOGUE, ch=1,
           af="highpass=f=70,"
              "equalizer=f=4500:t=q:w=1.2:g=1.0,"
              "acompressor=threshold=-20dB:ratio=2.5:attack=6:release=150:makeup=1.5,"
              "deesser=i=0.3,alimiter=limit=0.89,loudnorm=I=-16:TP=-2:LRA=6")
dlg = np.pad(dlg, ((0, max(0, N - len(dlg))), (0, 0)))[:N]
dlg = np.repeat(dlg, 2, axis=1)

# ---------------------------------------------------------------- music
M_START, JUMP_FROM, JUMP_TO = 8.7307, 44.21, 75.51
mus = load(f"{'work/audio/music'}/march2.mp3", af="loudnorm=I=-16:TP=-2")
a = mus[int(M_START * SR):int(JUMP_FROM * SR)]
b = mus[int(JUMP_TO * SR):]
X = int(0.06 * SR)  # 60 ms equal-power crossfade on the bar line
r = np.linspace(0, 1, X)[:, None]
joined = np.concatenate([a[:-X], a[-X:] * np.cos(r * np.pi / 2) + b[:X] * np.sin(r * np.pi / 2), b[X:]])
music = np.zeros((N, 2), np.float32)
music[:min(N, len(joined))] = joined[:N]
music[: int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR))[:, None]
music[N - int(0.8 * SR):] *= np.linspace(1, 0, int(0.8 * SR))[:, None]
print(f"music: start {M_START:.2f}s; jump at edit {JUMP_FROM - M_START:.2f}s; "
      f"section change at edit {34.8 - M_START:.2f}s; ending at edit {JUMP_FROM - M_START + 117.6 - JUMP_TO:.2f}s")

speech = np.zeros(int(DUR * 100) + 1, np.float32)
for w in words:
    speech[int((w["s"] - 0.12) * 100):int((w["e"] + 0.22) * 100)] = 1
UNDER, OPEN = -16.0, -7.0
g = np.where(speech > 0, UNDER, OPEN).astype(np.float32)
k = np.ones(30, np.float32) / 30
g = np.convolve(np.pad(g, (15, 14), mode="edge"), k, mode="valid")[: len(speech)]
music *= db(np.interp(np.arange(N) / SR, np.arange(len(g)) / 100, g))[:, None].astype(np.float32)

# ---------------------------------------------------------------- SFX
_c = {}


def sfx(name, t=None, fade_out=None):
    key = (name, t, fade_out)
    if key not in _c:
        x = load(f"{FS}/{name}.mp3" if os.path.exists(f"{FS}/{name}.mp3") else name, t=t)
        x = x / (np.abs(x).max() + 1e-9) * db(-1)
        n = len(x)
        x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))[:, None]
        fo = int((fade_out or 0.02) * SR)
        x[n - fo:] *= np.linspace(1, 0, fo)[:, None]
        _c[key] = (x, int(np.argmax(np.abs(x).max(1))))
    return _c[key]


fx = np.zeros((N, 2), np.float32)


def put(x, i, gdb, pan=0.0):
    x = x * db(gdb)
    if pan:
        x = x * np.array([np.sqrt(0.5 - pan / 2) * 1.414, np.sqrt(0.5 + pan / 2) * 1.414], np.float32)
    i = max(0, i)
    j = min(N, i + len(x))
    if i < N:
        fx[i:j] += x[: j - i]


def hit(at, name, gdb, align="peak", pan=0.0, t=None, fade_out=None):
    """Place a sound so its loudest point (or its start) lands on `at`."""
    x, pk = sfx(name, t, fade_out)
    put(x, int(at * SR) - (pk if align == "peak" else 0), gdb, pan)


KEYS = [load(p) for p in sorted(glob.glob(f"{FS}/keys/k*.wav"))]
rng = np.random.default_rng(11)


def typing(text, t0, t1, gdb=-21):
    """One keystroke per character, at the frame the character appears."""
    n = len(text)
    for i in range(1, n + 1):
        at = t0 + (i - 0.5) / n * (t1 - t0)
        if text[i - 1] == " ":
            continue
        k = KEYS[rng.integers(len(KEYS))]
        put(k, int(at * SR), gdb + rng.uniform(-2.5, 1.5), pan=rng.uniform(-0.15, 0.15))


# hook: prompt typed and sent
hit(1.36, "whoosh_short", -22)
typing("Which PR agency should we hire?", 1.5, 2.85)
hit(3.06, "ui_click", -11)
# AI shortlist
hit(5.32, "whoosh_light", -11)
hit(8.26, "notify", -23)
for i in range(3):
    hit(8.55 + i * 0.15, "ui_select", -25, pan=-0.2 + i * 0.2)
hit(9.62, "shimmer_coin", -19)
hit(9.98, "ui_hint", -20)
hit(10.66, "whoosh_short", -23)
hit(10.88, "impact_low", -17, t=0.9, fade_out=0.5)        # "Not mentioned"
hit(11.3, "woosh_quick", -12)
hit(12.9, "whoosh_short", -25)                            # name over Ben
for i, d in enumerate([0, 2, 4, 1, 3, 5]):                # AI engines float in
    hit(15.5 + d * 0.13, "pop", -27, pan=(-0.5 if i < 3 else 0.5))
hit(19.55, "whoosh_short", -25)
# Meet Seekworthy -> brand -> dashboard
hit(25.78, "revcym_glassy", -15)
hit(26.0, "subdrop", -10)
hit(26.05, "shimmer_success", -15)
hit(27.3, "whoosh_light", -14)
for i in range(3):
    hit(28.55 + i * 0.1, "ui_hint", -27)
for i in range(4):
    hit(30.0 + i * 0.12, "ui_select", -27)
hit(32.0, "woosh_quick", -13)
# website -> buyer questions -> engines
hit(32.2, "whoosh_short", -23)
typing("venturepr.com", 32.3, 32.9)
hit(33.11, "ui_click", -11)
hit(33.66, "whoosh_light", -11)
for at in (34.32, 34.64, 34.97):
    hit(at, "chime", -19)
hit(36.76, "woosh_slide", -12)
for i in range(6):
    hit(37.37 + i * 0.19, "ui_hint", -24 + i * 0.5, pan=-0.5 + i * 0.2)
hit(38.68, "whoosh_short", -21)
hit(39.64, "shimmer_coin", -16)
hit(40.0, "notify", -19)
hit(41.16, "woosh_slide", -12)
for i in range(5):
    hit(41.76 + i * 0.1, "ui_select", -27)
hit(44.48, "whoosh_light", -12)
for i in range(3):
    hit(45.34 + i * 0.16, "ui_select", -27)
hit(47.1, "woosh_quick", -13)
# back on Ben: next actions
hit(52.84, "whoosh_short", -21)
for at in (53.33, 54.98, 55.97, 58.5):
    hit(at, "chime", -17)
    hit(at, "ui_click", -22)
hit(58.86, "whoosh_light", -12)
hit(59.8, "riser_short", -24)
hit(60.34, "woosh_quick", -13)
# URL, free check, end card
typing("seekworthy.ai", 66.72, 67.3, gdb=-22)
hit(68.22, "whoosh_short", -22)
typing("yourbrand.com", 68.32, 68.92)
hit(70.03, "ui_click", -11)
hit(70.66, "pop", -23)
hit(74.86, "revcym_glassy", -15)
hit(75.0, "subdrop", -11)
hit(75.1, "shimmer_success", -16)

mix = dlg + music + fx
peak = np.abs(mix).max()
print(f"pre-master peak {20 * np.log10(peak):.1f} dBFS")
mix = mix / max(1.0, peak / db(-1))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-c:a", "pcm_f32le", "build/mix_pre.wav"], input=mix.astype(np.float32).tobytes(), check=True)
meas = subprocess.run(["ffmpeg", "-v", "info", "-i", "build/mix_pre.wav", "-af",
                       "loudnorm=I=-14:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
js = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.2:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/mix_pre.wav", "-af", af, "-ar", "48000",
                "-c:a", "pcm_s16le", "build/mix.wav"], check=True)
# stems for checking the balance
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-c:a", "pcm_s16le", "build/stem_dialogue.wav"], input=dlg.astype(np.float32).tobytes(), check=True)
print("mastered build/mix.wav; measured input", js["input_i"], "LUFS")

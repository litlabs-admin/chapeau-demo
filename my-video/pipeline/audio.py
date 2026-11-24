"""Sound: restored dialogue + "march 2" bed + timeline-placed SFX.

Balance follows the reference film (its stems separated with Demucs): there
the music and effects sit only ~5 LU under the voice and are barely ducked.
Here the bed sits ~10.5 LU under Ben while he talks (measured on the stems) and
lifts ~4 dB between lines; the music's 250 Hz-5 kHz band is carved a further
5 dB under speech so it can stay present without masking him.

Music: "march 2" by Ondrosik (Free Music Archive, CC0 1.0). Starts on the bar
at 12.89 s so its section change lands on "Meet Seekworthy"; one bar-matched
jump (42.12 -> 77.60 s, chroma/MFCC similarity) lands its own ending on the
last frame.
SFX: Freesound CC0 (credits in VIDEO.md). Cue times and levels come from the
graphics timeline (build/gfx/sfx.json), so every sound sits on its visual.

Writes build/mix.wav (48 kHz stereo, -14 LUFS integrated, -1 dBTP).
"""
import glob
import json
import subprocess

import numpy as np
from scipy.signal import butter, sosfiltfilt

SR = 48000
FS = "work/audio/fs"
cl = json.load(open("build/cutlist.json"))
words = json.load(open("build/words.json"))
DUR = cl["frames"] / 30
N = int(DUR * SR)
CUES = json.load(open("build/gfx/sfx.json"))


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


# ---------------------------------------------------------------- dialogue (already restored, -16 LUFS)
dlg = load("build/enh/dialogue_enhanced.wav", ch=1)
dlg = np.pad(dlg, ((0, max(0, N - len(dlg))), (0, 0)))[:N]
dlg = np.repeat(dlg, 2, axis=1)

# ---------------------------------------------------------------- music
M_START, JUMP_FROM, JUMP_TO = 12.887, 42.12, 77.60
mus = load("work/audio/music/march2.mp3", af="loudnorm=I=-16:TP=-2")
a = mus[int(M_START * SR):int(JUMP_FROM * SR)]
b = mus[int(JUMP_TO * SR):]
X = int(0.06 * SR)
r = np.linspace(0, 1, X)[:, None]
joined = np.concatenate([a[:-X], a[-X:] * np.cos(r * np.pi / 2) + b[:X] * np.sin(r * np.pi / 2), b[X:]])
music = np.zeros((N, 2), np.float32)
music[:min(N, len(joined))] = joined[:N]
music[: int(0.25 * SR)] *= np.linspace(0, 1, int(0.25 * SR))[:, None]
music[N - int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))[:, None]

speech = np.zeros(int(DUR * 100) + 1, np.float32)
for w in words:
    speech[int((w["s"] - 0.1) * 100):int((w["e"] + 0.18) * 100)] = 1
k = np.ones(20, np.float32) / 20
sp = np.convolve(np.pad(speech, (10, 9), mode="edge"), k, mode="valid")[: len(speech)]
sp = np.interp(np.arange(N) / SR, np.arange(len(sp)) / 100, sp).astype(np.float32)[:, None]
UNDER, OPEN, CARVE = -5.5, -1.5, -5.0
sos_lo = butter(4, 250, "lowpass", fs=SR, output="sos")
sos_hi = butter(4, 5000, "highpass", fs=SR, output="sos")
lo = sosfiltfilt(sos_lo, music, axis=0)
hi = sosfiltfilt(sos_hi, music, axis=0)
mid = music - lo - hi
gain = db(OPEN + (UNDER - OPEN) * sp)
music = (lo + hi + mid * db(CARVE * sp)) * gain
music = music.astype(np.float32)

# ---------------------------------------------------------------- SFX from the timeline
_c = {}


def sfx(name, length=None):
    key = (name, length)
    if key not in _c:
        x = load(f"{FS}/{name}.mp3", t=length)
        x = x / (np.abs(x).max() + 1e-9) * db(-1)
        n = len(x)
        x[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))[:, None]
        fo = int((0.25 if length else 0.012) * SR)
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


KEYS = [load(p) for p in sorted(glob.glob(f"{FS}/keys/k*.wav"))]
rng = np.random.default_rng(11)
# loud whooshes/impacts peak on their cue; short UI sounds start on it
PEAK_ALIGNED = {"whoosh_light", "woosh_slide", "woosh_quick", "whoosh_short", "swoosh_halgrimm", "revcym_glassy", "riser_short", "subdrop"}
for c in CUES:
    if c["name"] == "type":
        text, dur = c["text"], c["dur"]
        for i in range(1, len(text) + 1):
            if text[i - 1] == " ":
                continue
            at = c["t"] + (i - 0.5) / len(text) * dur
            put(KEYS[rng.integers(len(KEYS))], int(at * SR), c["g"] + rng.uniform(-2.5, 1.5), pan=rng.uniform(-0.15, 0.15))
        continue
    x, pk = sfx(c["name"], c.get("len"))
    off = pk if c["name"] in PEAK_ALIGNED else 0
    put(x, int(c["t"] * SR) - off, c["g"], c.get("pan", 0.0))
print(f"{len(CUES)} SFX cues placed")

mix = dlg + music + fx
peak = np.abs(mix).max()
mix = mix / max(1.0, peak / db(-1))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-c:a", "pcm_f32le", "build/mix_pre.wav"], input=mix.astype(np.float32).tobytes(), check=True)
for name, sig in (("dialogue", dlg), ("music", music), ("fx", fx)):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", "pcm_f32le", f"build/stem_{name}.wav"], input=sig.astype(np.float32).tobytes(), check=True)
meas = subprocess.run(["ffmpeg", "-v", "info", "-i", "build/mix_pre.wav", "-af",
                       "loudnorm=I=-14:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
js = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.2:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/mix_pre.wav", "-af", af, "-ar", "48000",
                "-c:a", "pcm_s16le", "build/mix.wav"], check=True)
print("mastered build/mix.wav; measured input", js["input_i"], "LUFS")

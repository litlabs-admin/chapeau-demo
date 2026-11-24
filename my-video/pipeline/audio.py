"""Sound: cleaned dialogue + edited music bed (ducked under speech) + SFX cues.

Music: "Minimal Emotion" (Mixkit, track 160, Mixkit Stock Music Free License).
Its section change at bar 16 (29.79 s) is placed on the logo reveal (edit
26.0 s); a bar-36 -> bar-56 jump (on 4-bar phrase lines) lands the track's
outro under the call to action. SFX: Mixkit Sound Effects Free License.

Writes build/mix.wav (48 kHz stereo, -14 LUFS integrated, -1 dBTP).
"""
import json
import subprocess

import numpy as np

SR = 48000
FPS = 30
ROOT = "work/audio"
cl = json.load(open("build/cutlist.json"))
words = json.load(open("build/words.json"))
DUR = cl["frames"] / FPS
N = int(DUR * SR)


def load(path, ss=None, t=None, af=None):
    cmd = ["ffmpeg", "-v", "error"]
    if ss is not None:
        cmd += ["-ss", str(ss)]
    if t is not None:
        cmd += ["-t", str(t)]
    cmd += ["-i", path]
    if af:
        cmd += ["-af", af]
    cmd += ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def db(x):
    return 10 ** (x / 20)


def fade(x, fi=0.005, fo=0.03):
    n = len(x)
    a, b = int(fi * SR), int(fo * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    if b:
        x[n - b:] *= np.linspace(1, 0, b)[:, None]
    return x


# ---------------------------------------------------------------- dialogue
dlg = load("build/dialogue_raw.wav",
           af="highpass=f=85,afftdn=nr=8:nf=-48,equalizer=f=280:t=q:w=1.2:g=-3,"
              "equalizer=f=3600:t=q:w=1.0:g=2.5,equalizer=f=9000:t=q:w=1:g=1,"
              "acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=2,"
              "deesser=i=0.35,loudnorm=I=-16:TP=-2:LRA=7")
dlg = np.pad(dlg, ((0, max(0, N - len(dlg))), (0, 0)))[:N]

# ---------------------------------------------------------------- music
BEAT0, BEAT = 0.07, 60 / 129.2
bar = lambda n: BEAT0 + n * 4 * BEAT  # noqa: E731
m_in, m_jump_from, m_jump_to = bar(2), bar(36), bar(56)
mus = load(f"{ROOT}/music/160.mp3", af="loudnorm=I=-16:TP=-2")
a = mus[int(m_in * SR):int(m_jump_from * SR)].copy()
b = mus[int(m_jump_to * SR):].copy()
X = int(0.04 * SR)  # 40 ms equal-power crossfade at the jump
ramp = np.linspace(0, 1, X)[:, None]
joined = np.concatenate([a[:-X], a[-X:] * np.cos(ramp * np.pi / 2) + b[:X] * np.sin(ramp * np.pi / 2), b[X:]])
music = np.zeros((N, 2), np.float32)
music[:min(N, len(joined))] = joined[:N]
music[: int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))[:, None]
music[N - int(1.6 * SR):] *= np.linspace(1, 0, int(1.6 * SR))[:, None] ** 1.5
print(f"music: in {m_in:.2f}s, jump {m_jump_from:.2f}->{m_jump_to:.2f} at edit {m_jump_from - m_in:.2f}s, "
      f"drop (bar 16 = {bar(16):.2f}) at edit {bar(16) - m_in:.2f}s")

# duck: bed sits ~17 dB under the voice while he talks, lifts between lines
speech = np.zeros(int(DUR * 100) + 1, np.float32)
for w in words:
    speech[int((w["s"] - 0.12) * 100):int((w["e"] + 0.2) * 100)] = 1
UNDER, OPEN = -17.0, -8.5
g = np.where(speech > 0, UNDER, OPEN).astype(np.float32)
# smooth: 250 ms ramps
k = np.ones(25, np.float32) / 25
g = np.convolve(np.pad(g, (12, 12), mode="edge"), k, mode="valid")[: len(speech)]
gain = np.interp(np.arange(N) / SR, np.arange(len(g)) / 100, g)
music *= db(gain)[:, None].astype(np.float32)

# ---------------------------------------------------------------- SFX
_cache = {}


def sfx(id_, ss=None, t=None):
    key = (id_, ss, t)
    if key not in _cache:
        x = load(f"{ROOT}/sfx/{id_}.mp3", ss=ss, t=t)
        x = x / (np.abs(x).max() + 1e-9) * db(-1)
        _cache[key] = fade(x, 0.002, 0.03 if t else 0.01)
    return _cache[key]


fx = np.zeros((N, 2), np.float32)


def cue(at, id_, gdb, ss=None, t=None):
    x = sfx(id_, ss, t) * db(gdb)
    i = int(at * SR)
    j = min(N, i + len(x))
    if i < N:
        fx[i:j] += x[: j - i]


WHOOSH, SWEEP, SLIDE = 174, 166, 3115
ZOOM, POP, POP2, POPL, CLICK = 2618, 3005, 2356, 2358, 2568
CHECK, TICK, TONE = 1120, 2866, 2520

# hook
cue(1.26, POP, -22)
cue(1.45, 2537, -13, ss=1.2, t=1.45)          # typing the prompt
cue(3.04, CLICK, -14)
# shortlist screen
cue(5.02, WHOOSH, -12)
cue(8.24, 2354, -14)
for i in range(3):
    cue(8.5 + i * 0.16, POP2, -21)
cue(9.6, 168, -22)
cue(9.95, 2364, -20)
cue(10.6, SWEEP, -21)
cue(10.84, 2946, -16)                          # "not mentioned"
cue(11.2, ZOOM, -12)
cue(11.45, 772, -15)                           # "Would you know?"
cue(12.58, SWEEP, -22)                         # lower third
for i, d in enumerate([0, 2, 4, 1, 3, 5]):     # engine chips
    cue(15.42 + d * 0.13, POPL, -24)
cue(17.62, TICK, -26)
cue(19.48, POP, -24)
cue(20.62, 2364, -24)
cue(23.18, 2364, -22)
# logo reveal + dashboard
cue(24.74, POPL, -18)
cue(25.15, 2669, -13)                          # swell into the iris
cue(25.98, 2902, -9)                           # logo hit on the music lift
cue(27.0, 3120, -16)
for i in range(3):
    cue(28.45 + i * 0.1, 2364, -26)
cue(29.9, 2634, -22)
cue(31.85, ZOOM, -13)
# website -> questions -> engines
cue(32.1, SWEEP, -22)
cue(32.3, 2537, -13, ss=4.0, t=0.7)
cue(33.08, CLICK, -13)
cue(33.4, WHOOSH, -12)
for at in (34.3, 34.62, 34.95):
    cue(at, TONE, -22)
cue(36.52, SLIDE, -12)
for i in range(6):
    cue(37.35 + i * 0.19, TICK, -25 + i * 0.6)
cue(38.58, SWEEP, -21)
cue(39.58, 2870, -17)                          # brand mention found
cue(40.92, SLIDE, -12)
for i in range(5):
    cue(41.72 + i * 0.1, POP2, -24)
cue(44.12, WHOOSH, -14)
for i in range(3):
    cue(45.3 + i * 0.16, POP2, -24)
cue(46.98, ZOOM, -13)
# back to Ben
cue(47.7, POP, -25)
cue(50.0, POP, -25)
cue(51.26, 772, -19)
cue(51.98, 2364, -22)
cue(52.74, SWEEP, -21)
for at in (53.31, 54.96, 55.95, 58.48):
    cue(at, CHECK, -12)
cue(58.6, WHOOSH, -13)
cue(58.85, 2669, -17)
cue(60.2, ZOOM, -14)
cue(63.8, POP, -25)
cue(64.9, POP, -25)
cue(65.58, 2364, -22)
cue(66.72, 2537, -14, ss=6.0, t=0.62)
cue(68.12, SWEEP, -22)
cue(68.32, 2537, -13, ss=8.0, t=0.62)
cue(70.0, CLICK, -13)
cue(70.6, POPL, -19)
cue(71.68, POP, -25)
cue(73.54, 2364, -22)
cue(74.48, 2634, -17)
cue(74.94, 2900, -11)                          # end card

mix = dlg + music + fx
peak = np.abs(mix).max()
print(f"pre-master peak {20 * np.log10(peak):.1f} dBFS")
mix = mix / max(1.0, peak / db(-1))
raw = mix.astype(np.float32).tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                "-c:a", "pcm_f32le", "build/mix_pre.wav"], input=raw, check=True)

# two-pass loudness master to -14 LUFS / -1 dBTP
meas = subprocess.run(["ffmpeg", "-v", "info", "-i", "build/mix_pre.wav", "-af",
                       "loudnorm=I=-14:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
js = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1.2:LRA=9:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/mix_pre.wav", "-af", af, "-ar", "48000",
                "-c:a", "pcm_s16le", "build/mix.wav"], check=True)
print("mastered build/mix.wav; measured input", js["input_i"], "LUFS")

"""Ben's dialogue, phone mic in a lamp-lit room -> clean, even, warm voice.

1. WPE de-reverberation (nara_wpe; classical linear prediction, cannot
   invent speech) to pull the room off the voice.
2. Resemble Enhance, denoise-only (word-faithful; its generative "enhance"
   mode was tested and rejected because it changed words).
3. Line levelling: every cut segment is brought to the same speech loudness
   (takes recorded minutes apart differed by up to 4.6 dB).
4. Harmonic exciter above 3.2 kHz (rebuilds the top end the phone codec cut),
   then match EQ toward the reference film's voice (separated with Demucs):
   80 % of the difference, limited to +/-8 dB, smoothed over 1/3 octaves.
5. Gentle compression, de-ess, limiter.

    python3 pipeline/enhance_voice.py        -> build/enh/dialogue_enhanced.wav
"""
import json
import os
import subprocess

import librosa
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from nara_wpe.utils import istft, stft
from nara_wpe.wpe import wpe
from scipy.signal import firwin2, fftconvolve

SR = 48000
os.makedirs("build/enh/in", exist_ok=True)
x, _ = librosa.load("build/dialogue_raw.wav", sr=SR, mono=True)

# 1. WPE
Y = stft(x[None, :], size=1024, shift=256).transpose(2, 0, 1)
Z = wpe(Y, taps=12, delay=3, iterations=3, statistics_mode="full").transpose(1, 2, 0)
d = istft(Z, size=1024, shift=256)[0][: len(x)]
d = np.pad(d, (0, len(x) - len(d)))
sf.write("build/enh/in/ben.wav", d.astype(np.float32), SR)
print("wpe done")

# 2. denoise (isolated env)
subprocess.run(["work/enh/bin/resemble-enhance", "build/enh/in", "build/enh/out_denoise", "--device", "cpu",
                "--denoise_only"], check=True, capture_output=True)
y, _ = librosa.load("build/enh/out_denoise/ben.wav", sr=SR, mono=True)
y = np.pad(y, (0, max(0, len(x) - len(y))))[: len(x)]

# 3. line levelling on the cut list
cl = json.load(open("build/cutlist.json"))
words = json.load(open("build/words.json"))
meter = pyln.Meter(SR)
TARGET = -20.0
gain = np.ones(len(y), np.float32)
for s in cl["segments"]:
    a, b = int(s["edit_f0"] / 30 * SR), int(s["edit_f1"] / 30 * SR)
    seg = y[a:b]
    sp = np.zeros(len(seg), bool)
    for w in words:
        i, j = int(w["s"] * SR) - a, int(w["e"] * SR) - a
        if j > 0 and i < len(seg):
            sp[max(0, i):min(len(seg), j)] = True
    if s.get("gap") or sp.sum() < SR * 0.4:
        continue
    lufs = meter.integrated_loudness(seg[sp]) if sp.sum() > SR * 0.4 else TARGET
    g = np.clip(TARGET - lufs, -4.5, 4.5)
    gain[a:b] = 10 ** (g / 20)
# smooth gain changes over 15 ms (joins already have 10 ms fades)
k = np.ones(int(0.015 * SR)) / int(0.015 * SR)
gain = np.convolve(gain, k, mode="same").astype(np.float32)
y = y * gain
# rebuild the top end the phone codec and the denoiser removed (harmonic exciter)
sf.write("build/enh/stage3.wav", y.astype(np.float32), SR)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/enh/stage3.wav", "-af",
                "aexciter=level_in=1:level_out=1:amount=2.6:drive=7:blend=0:freq=3200:ceil=18000:listen=0",
                "-ar", str(SR), "build/enh/stage3x.wav"], check=True)
y, _ = librosa.load("build/enh/stage3x.wav", sr=SR, mono=True)

# 4. match EQ toward the reference voice
def band_db(sig, sr):
    S = np.abs(librosa.stft(sig, n_fft=8192, hop_length=2048)) ** 2
    return librosa.fft_frequencies(sr=sr, n_fft=8192), 10 * np.log10(S.mean(1) + 1e-12)


ref, rsr = librosa.load("work/refaudio/sep/htdemucs/arist/vocals.wav", sr=SR, mono=True)
rr = librosa.feature.rms(y=ref, frame_length=2048, hop_length=480)[0]
keep = np.repeat(20 * np.log10(rr + 1e-9) > np.percentile(20 * np.log10(rr + 1e-9), 95) - 25, 480)[: len(ref)]
f, Rdb = band_db(ref[: len(keep)][keep], SR)
_, Bdb = band_db(y, SR)
centres = 31.25 * 2 ** (np.arange(0, 30) / 3)            # 1/3-octave grid 31 Hz .. 20 kHz
centres = centres[centres < 20000]
diff = []
for c in centres:
    m = (f >= c / 2 ** (1 / 6)) & (f < c * 2 ** (1 / 6))
    diff.append(np.mean(Rdb[m]) - np.mean(Bdb[m]) if m.any() else 0)
diff = np.array(diff)
ref_lvl = np.mean(diff[(centres >= 400) & (centres <= 1600)])   # level-neutral around the mids
corr = np.clip(0.8 * (diff - ref_lvl), -8, 8)
corr[centres < 70] = 0
corr = np.convolve(np.pad(corr, 1, mode="edge"), [0.25, 0.5, 0.25], mode="valid")
freqs = np.concatenate([[0], centres, [SR / 2]]) / (SR / 2)
gains = 10 ** (np.concatenate([[0], corr, [corr[-1]]]) / 20)
fir = firwin2(4097, freqs, gains)
y = fftconvolve(y, fir, mode="same")
print("match EQ (dB) by 1/3 octave:", {int(c): round(float(v), 1) for c, v in zip(centres, corr) if c >= 100})
sf.write("build/enh/stage4.wav", y.astype(np.float32), SR)

# 5. dynamics + loudness
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "build/enh/stage4.wav", "-af",
                "highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=160:makeup=2,"
                "deesser=i=0.25,alimiter=limit=0.9,loudnorm=I=-16:TP=-2:LRA=5",
                "-ar", str(SR), "build/enh/dialogue_enhanced.wav"], check=True)
print("build/enh/dialogue_enhanced.wav")

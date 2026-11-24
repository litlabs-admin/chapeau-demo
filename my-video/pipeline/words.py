"""Word timings on the edit timeline, for captions and type sync.

Re-transcribes build/dialogue_raw.wav (the conformed dialogue) with Whisper
word timestamps, corrects the brand spelling, then snaps word starts that sit
next to a pause onto the measured speech onset (Whisper's word starts can be
0.1-0.5 s early across a pause). Writes build/words.json.
"""
import json
import wave

import numpy as np
from faster_whisper import WhisperModel

FPS = 30
w = wave.open("build/dialogue_raw.wav")
sr = w.getframerate()
audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
a16 = audio[:: sr // 16000] if sr % 16000 == 0 else audio  # 48k -> 16k by decimation (speech band only)

model = WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
segs, _ = model.transcribe(a16, word_timestamps=True, beam_size=5,
                           initial_prompt="Seekworthy helps businesses see how they show up in AI answers. ChatGPT, seekworthy.ai.")
words = [dict(w=x.word.strip(), s=x.start, e=x.end) for s in segs for x in s.words]

hop = sr // 100
n = len(audio) // hop
db = 20 * np.log10(np.sqrt((audio[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12))
loud = db > (np.percentile(db, 10) + 14)

for x in words:
    i0 = int(x["s"] * 100)
    # quiet just before the start? move the start to where speech resumes
    lo, hi = max(0, i0 - 10), min(n - 1, i0 + 45)
    run, best = 0, None
    for i in range(lo, hi):
        if not loud[i]:
            run += 1
        else:
            if run >= 8:
                best = i
                break
            run = 0
    if best is not None and best / 100 < x["e"] - 0.05:
        x["s"] = best / 100
    x["w"] = (x["w"].replace("Seakworthy", "Seekworthy").replace("Seaworthy", "Seekworthy")
              .replace("chat GPT", "ChatGPT").replace("Chat GPT", "ChatGPT"))
    x["s"], x["e"] = round(x["s"], 3), round(x["e"], 3)

cl = json.load(open("build/cutlist.json"))
for x in words:
    f = x["s"] * FPS
    x["seg"] = next(i for i, s in enumerate(cl["segments"]) if s["edit_f0"] <= f < s["edit_f1"] + 1)
json.dump(words, open("build/words.json", "w"), indent=0)
line, cur = [], None
for x in words:
    if x["seg"] != cur and line:
        print(" ".join(line))
        line = []
    cur = x["seg"]
    line.append(f"{x['w']}@{x['s']:.2f}")
print(" ".join(line))

"""Paper edit -> frame-exact cut list.

Each select is (first_word_start, last_word_end, extra_tail_seconds, note) in
source seconds, taken from Whisper word times (work/transcript.json). Every
boundary is snapped to the real speech onset/offset measured on the audio
envelope, padded per the launch-cut join table (-0.05 s in, +0.08 s out),
then rounded to whole frames at 30 fps.

Writes build/cutlist.json (segments with source/edit frame ranges) and
build/words.json (every kept word re-timed onto the edit timeline).
"""
import json
import wave

import numpy as np

FPS = 30
SRC_WAV = "build/src.wav"
TRANSCRIPT = "work/transcript.json"

# (src_in, src_out, extra_tail, label). Times are the Whisper word bounds of
# the chosen take; extra_tail holds on Ben after the line for a beat or a
# graphic moment (source room tone, no added silence).
SELECTS = [
    (42.32, 47.54, 0.00, "hook: next customer could ask AI"),
    (62.94, 67.64, 0.10, "they ask ChatGPT which company"),
    (71.86, 73.46, 0.00, "your competitor's on it"),
    (73.72, 74.04, 0.25, "you're not"),
    (74.58, 75.00, 0.45, "would you know?"),
    (78.92, 81.32, 0.05, "I'm Ben, founder of Seekworthy"),
    (87.62, 91.38, 0.20, "we help businesses see"),
    (118.22, 121.12, 0.00, "but when a buyer asks AI for advice"),
    (121.92, 124.26, 0.30, "you need to know if you show up"),
    (132.86, 134.30, 0.35, "that's why we built Seekworthy"),
    ("GAP", 1.20, "logo reveal"),
    (134.42, 139.06, 0.15, "it helps you understand"),
    ("GAP", 0.70, "dashboard hold"),
    (150.38, 154.62, 0.15, "you start with your website"),
    ("GAP", 0.60, "prompt list hold"),
    (176.28, 182.30, 0.10, "Seekworthy checks those questions"),
    ("GAP", 0.50, "mention highlight hold"),
    (240.03, 245.34, 0.20, "competitors appear / sources cite"),
    ("GAP", 0.80, "citations hold"),
    (266.08, 269.76, 0.10, "go beyond checking your name once"),
    (271.12, 272.90, 0.30, "check and fix the gaps"),
    (284.00, 285.69, 0.05, "correct an inaccurate description"),
    (286.24, 286.90, 0.10, "improve a page"),
    (291.18, 293.96, 0.10, "create content"),
    (296.72, 298.78, 0.35, "check again"),
    ("GAP", 0.60, "trend up hold"),
    (304.06, 307.18, 0.20, "no one can promise"),
    (313.70, 317.00, 0.35, "stop guessing, evidence"),
    (339.26, 341.06, 0.10, "go to seekworthy.ai"),
    (341.60, 343.84, 0.05, "enter your website, free check"),
    (344.30, 344.96, 0.25, "no card needed"),
    (347.68, 350.80, 0.60, "find out whether AI is recommending"),
    ("GAP", 2.40, "end card"),
]

# Room-tone stretch (Ben silent) used under full-screen graphic beats.
GAP_SRC = 26.0
IN_PAD = 0.05
OUT_PAD = 0.08


def load_env():
    w = wave.open(SRC_WAV)
    sr = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    hop = sr // 100  # 10 ms
    n = len(a) // hop
    rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms)
    return db


def main():
    db = load_env()
    floor = np.percentile(db, 10)
    thr = floor + 14  # speech threshold ~14 dB over the room
    print(f"noise floor {floor:.1f} dBFS, speech threshold {thr:.1f}")

    loud = db > thr
    GAP = 20  # 200 ms of quiet counts as a pause

    def onset(t, first_word_end):
        """Speech start of the first word: the end of the last >=200 ms
        pause before the word finishes (Whisper often starts a word early,
        across the pause that precedes it)."""
        lo, hi = int((t - 0.4) * 100), int((first_word_end + 0.15) * 100)
        best, run = None, 0
        for i in range(lo, hi):
            if not loud[i]:
                run += 1
            else:
                if run >= GAP:
                    best = i
                run = 0
        if best is not None:
            return best / 100
        for i in range(lo, hi + 40):
            if loud[i] and loud[i + 1]:
                return i / 100
        return t

    def offset(t, last_word_start):
        """Speech end of the last word: the start of the first >=200 ms
        pause after the word has begun."""
        lo, hi = int((last_word_start + 0.08) * 100), int((t + 0.7) * 100)
        for i in range(lo, hi):
            if not loud[i:i + GAP].any():
                return i / 100
        return t

    words = json.load(open(TRANSCRIPT))
    allw = [w for s in words for w in s["words"]]

    segs, out_words, edit_f = [], [], 0
    for sel in SELECTS:
        if sel[0] == "GAP":
            n = round(sel[1] * FPS)
            fa = round(GAP_SRC * FPS)
            segs.append(dict(label="GAP " + sel[2], gap=True, src_in=fa / FPS, src_out=(fa + n) / FPS,
                             src_f0=fa, src_f1=fa + n, frames=n, edit_f0=edit_f, edit_f1=edit_f + n))
            edit_f += n
            continue
        src_in, src_out, tail, label = sel
        kept = [w for w in allw if src_in - 0.01 <= w["s"] <= src_out + 0.01]
        before = [w for w in allw if w["e"] <= src_in + 0.01]
        after = [w for w in allw if w["s"] >= src_out - 0.01 and w not in kept]
        a = onset(src_in, kept[0]["e"]) - IN_PAD
        b = offset(src_out, kept[-1]["s"]) + OUT_PAD + tail
        # Never reach into the neighbouring words of the same take.
        if before:
            prev_end = offset(before[-1]["e"], before[-1]["s"])
            a = max(a, prev_end + 0.04)
        if after:
            nxt = onset(after[0]["s"], after[0]["e"])
            b = min(b, nxt - 0.04)
        fa, fb = round(a * FPS), round(b * FPS)
        n = fb - fa
        segs.append(dict(label=label, src_in=fa / FPS, src_out=fb / FPS, src_f0=fa, src_f1=fb,
                         frames=n, edit_f0=edit_f, edit_f1=edit_f + n))
        for w in allw:
            if src_in - 0.01 <= w["s"] <= src_out + 0.01:
                s = max(w["s"], fa / FPS)
                e = min(w["e"], fb / FPS)
                out_words.append(dict(w=w["w"].strip(), s=round(edit_f / FPS + s - fa / FPS, 3),
                                      e=round(edit_f / FPS + e - fa / FPS, 3), seg=len(segs) - 1))
        edit_f += n

    # Transcript spelling fixes (Whisper hears the brand as "Seakworthy").
    for w in out_words:
        w["w"] = (w["w"].replace("Seakworthy", "Seekworthy").replace("chat", "Chat")
                  .replace("competitors", "competitor's"))
        if w["w"] == "seekworthy":
            w["w"] = "seekworthy"
    json.dump(dict(fps=FPS, frames=edit_f, segments=segs), open("build/cutlist.json", "w"), indent=1)
    json.dump(out_words, open("build/words.json", "w"), indent=0)
    for s in segs:
        print(f"{s['edit_f0']:5d}-{s['edit_f1']:5d}  src {s['src_in']:7.2f}-{s['src_out']:7.2f}  {s['label']}")
    print(f"total {edit_f} frames = {edit_f / FPS:.2f} s")


if __name__ == "__main__":
    main()

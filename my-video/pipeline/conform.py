"""Cut list -> build/aroll.mp4 (picture, 1280x720 @30, exact frames + 0.5 s
handle) and build/dialogue_raw.wav (48 kHz mono, 10 ms fades at every join).

Gap segments take the picture from a silent stretch of the source (it is
always covered by a full-screen graphic) and the source's own room tone.
"""
import json
import subprocess

FPS = 30
cl = json.load(open("build/cutlist.json"))
segs = cl["segments"]

import os
os.makedirs("build/segs", exist_ok=True)
lst = open("build/segs/list.txt", "w")
for i, s in enumerate(segs):
    f0, f1 = s["src_f0"], s["src_f1"]
    n = f1 - f0
    t0 = f0 / FPS
    d = n / FPS
    vp = f"build/segs/v{i:02d}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.6f}", "-i", "build/src30.mp4",
                    "-frames:v", str(n), "-c:v", "libx264", "-preset", "medium", "-crf", "8", "-g", "15",
                    "-pix_fmt", "yuv420p", "-an", vp], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.6f}", "-t", f"{d:.6f}", "-i", "build/src.wav",
                    "-af", f"afade=t=in:d=0.01,afade=t=out:st={d - 0.01:.6f}:d=0.01,apad=whole_dur={d:.6f}",
                    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", f"build/segs/a{i:02d}.wav"], check=True)
    lst.write(f"file 'v{i:02d}.mp4'\n")
lst.close()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "build/segs/list.txt",
                "-vf", "tpad=stop_mode=clone:stop_duration=0.5", "-c:v", "libx264", "-preset", "medium",
                "-crf", "8", "-g", "15", "-pix_fmt", "yuv420p", "build/aroll.mp4"], check=True)
ins = []
for i in range(len(segs)):
    ins += ["-i", f"build/segs/a{i:02d}.wav"]
subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex",
                "".join(f"[{i}:a]" for i in range(len(segs))) + f"concat=n={len(segs)}:v=0:a=1[a]",
                "-map", "[a]", "-c:a", "pcm_s16le", "build/dialogue_raw.wav"], check=True)

out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
                      "stream=nb_read_frames", "-of", "csv=p=0", "build/aroll.mp4"], capture_output=True, text=True)
dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                      "build/dialogue_raw.wav"], capture_output=True, text=True)
print("aroll frames", out.stdout.strip(), "planned", cl["frames"], "+15 handle")
print("dialogue", dur.stdout.strip(), "s planned", cl["frames"] / FPS)

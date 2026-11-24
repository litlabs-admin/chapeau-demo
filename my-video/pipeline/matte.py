"""Robust Video Matting (resnet50, ONNX release) over build/aroll.mp4 -> build/alpha.mkv
(8-bit gray FFV1, one alpha frame per A-roll frame).

Recurrent state is reset at every cut so a matte never leaks across a join.
"""
import json
import subprocess
import sys
import time

import cv2
import numpy as np
import onnxruntime as ort

W, H = 1280, 720
cl = json.load(open("build/cutlist.json"))
cuts = {s["edit_f0"] for s in cl["segments"]}

opts = ort.SessionOptions()
opts.intra_op_num_threads = 4
sess = ort.InferenceSession("work/models/rvm_resnet50_fp32.onnx", opts, providers=["CPUExecutionProvider"])
zero = np.zeros((1, 1, 1, 1), np.float32)
ratio = np.array([0.375], np.float32)

cap = cv2.VideoCapture("build/aroll.mp4")
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}",
                        "-r", "30", "-i", "-", "-c:v", "ffv1", "build/alpha.mkv"], stdin=subprocess.PIPE)
rec = [zero] * 4
i, t0 = 0, time.time()
if True:
    while True:
        ok, bgr = cap.read()
        if not ok:
            break
        if i in cuts:
            rec = [zero] * 4
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        src = (rgb.transpose(2, 0, 1)[None].astype(np.float32) / 255)
        fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2],
                                         "r4i": rec[3], "downsample_ratio": ratio})
        a = (np.clip(pha[0, 0], 0, 1) * 255 + 0.5).astype(np.uint8)
        enc.stdin.write(a.tobytes())
        i += 1
        if i % 25 == 0:
            print(f"{i} frames {i / (time.time() - t0):.2f} fps", flush=True)
enc.stdin.close()
enc.wait()
print("done", i, file=sys.stderr)

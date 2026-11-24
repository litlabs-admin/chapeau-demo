"""Tile stills into 2x2 contact sheets: python3 pipeline/sheet.py DIR PREFIX"""
import glob
import sys
from PIL import Image, ImageDraw
d, pre = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(f"{d}/{pre}_*.jpg"))
for k in range(0, len(fs), 4):
    W = Image.new("RGB", (1920, 1080))
    for i, p in enumerate(fs[k:k + 4]):
        im = Image.open(p).resize((960, 540))
        ImageDraw.Draw(im).text((8, 6), p.split("_")[-1][:-4], fill="yellow")
        W.paste(im, ((i % 2) * 960, (i // 2) * 540))
    W.save(f"{d}/sheet_{pre}_{k // 4:02d}.jpg", quality=88)

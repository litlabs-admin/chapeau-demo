"""Composite the two deliverables, frame by frame.

  v1  "studio"  : Ben cut out of his room (RVM matte) onto a Seekworthy-navy
                  backdrop, colour-matched, with a cool rim light.
  v2  "room"    : Ben in his own room, graded and relit: neutralised white
                  balance, subject lifted, background darkened, softened and
                  desaturated (fake depth of field), filmic contrast, vignette.

Layer order (both): base -> graphics back layer -> Ben (matte) -> graphics
front layer -> grain. The back layer therefore sits *behind* Ben.

  python3 pipeline/composite.py v1|v2 [--at f1,f2 --stills DIR] [--gfx build/gfx]
"""
import argparse
import json
import os
import subprocess

import cv2
import numpy as np

W, H, FPS = 1920, 1080, 30
SW, SH = 1280, 720
BASE_SCALE = W / SW  # 1.5

ap = argparse.ArgumentParser()
ap.add_argument("version", choices=["v1", "v2"])
ap.add_argument("--at")
ap.add_argument("--stills")
ap.add_argument("--gfx", default="build/gfx")
ap.add_argument("--out")
args = ap.parse_args()
V1 = args.version == "v1"
TOTAL = json.load(open("build/cutlist.json"))["frames"]

# ---------------------------------------------------------------- framing
# (t0, t1, scale0, scale1, anchor_x, anchor_y, v1_dx). Scale is relative to
# the 1.5x fit of the 720p plate; the anchor (normalised plate coords) stays
# put while scaling, so the frame is always covered in v2. Pushes ease in/out.
SHOTS = [
    (0.00, 5.10, 1.00, 1.07, .48, .32, 150),
    (5.10, 11.43, 1.00, 1.00, .50, .50, 0),
    (11.43, 12.53, 1.20, 1.22, .48, .28, 0),
    (12.53, 15.00, 1.00, 1.02, .50, .40, 0),
    (15.00, 18.71, 1.06, 1.10, .48, .35, 0),
    (18.71, 21.39, 1.00, 1.03, .50, .40, 150),
    (21.39, 22.90, 1.10, 1.10, .48, .32, 150),
    (22.90, 23.89, 1.20, 1.22, .48, .30, 150),
    (23.89, 25.80, 1.00, 1.10, .48, .35, 0),
    (25.80, 32.10, 1.00, 1.00, .50, .50, 0),
    (32.10, 33.43, 1.04, 1.06, .42, .40, 170),
    (33.43, 47.17, 1.00, 1.00, .50, .50, 0),
    (47.17, 50.85, 1.00, 1.05, .50, .40, 150),
    (50.85, 52.73, 1.20, 1.22, .48, .28, 0),
    (52.73, 58.67, 1.04, 1.08, .40, .40, 190),
    (58.67, 60.40, 1.00, 1.00, .50, .50, 0),
    (60.40, 63.22, 1.08, 1.13, .48, .32, 0),
    (63.22, 66.43, 1.00, 1.04, .50, .40, 150),
    (66.43, 68.12, 1.14, 1.16, .48, .30, 0),
    (68.12, 71.61, 1.04, 1.06, .40, .40, 190),
    (71.61, 99.00, 1.00, 1.08, .50, .38, 150),
]
V1_DESK_Y = 628  # plate row where the desk edge cuts Ben off (v1 keeps it below frame)


def ease(x):
    x = min(1.0, max(0.0, x))
    return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2


def framing(t):
    for t0, t1, s0, s1, ax, ay, dx in SHOTS:
        if t0 <= t < t1:
            return s0 + (s1 - s0) * ease((t - t0) / (t1 - t0)), ax, ay, dx
    return 1.0, .5, .5, 0


def affine(t):
    s, ax, ay, dx = framing(t)
    S = BASE_SCALE * s
    px, py = ax * SW, ay * SH            # anchor in plate px
    ox, oy = ax * W, ay * H              # where it lands in the output
    if V1:
        # The phone frame crops Ben's crown, so the frame top must carry that
        # crop; zoom until the cut desk line is below frame.
        S = BASE_SCALE * max(s, 1.0) * 1.16
    tx, ty = ox - px * S, oy - py * S
    if V1:
        tx += dx
        ty = min(0.0, max(H - V1_DESK_Y * S, ty))
    return np.float32([[S, 0, tx], [0, S, ty]]), s


# ---------------------------------------------------------------- grading
def srgb_curve(x, contrast=1.0, pivot=0.45):
    """Gentle filmic S-curve around a pivot, toe and shoulder rolled off."""
    y = pivot + (x - pivot) * contrast
    return np.clip(y, 0, 1)


def smooth_s(x, amt):
    # blend with smoothstep for an S-curve that keeps the ends pinned
    s = x * x * (3 - 2 * x)
    return x + (s - x) * amt


def grade_v2(rgb, a):
    """rgb float32 720p, a float32 matte. Returns graded 720p plate."""
    # white balance: the room is lit by a warm lamp; pull the orange back
    rgb = rgb * np.float32([0.93, 0.985, 1.10])
    lum = rgb @ np.float32([0.2126, 0.7152, 0.0722])
    # background: darker, less saturated, softened (depth of field)
    bg = cv2.GaussianBlur(rgb, (0, 0), 4.2)
    bl = bg @ np.float32([0.2126, 0.7152, 0.0722])
    bg = bl[..., None] + (bg - bl[..., None]) * 0.72
    bg *= 0.70
    # subject: lift exposure a touch, keep skin saturation
    sub = rgb * 1.07
    sub = lum[..., None] * 1.07 + (sub - lum[..., None] * 1.07) * 1.04
    af = cv2.GaussianBlur(a, (0, 0), 1.5)[..., None]
    out = bg * (1 - af) + sub * af
    out = np.clip(out, 0, 1)
    out = smooth_s(out, 0.42)
    # split tone: navy-cool shadows, neutral-warm highlights
    l2 = out @ np.float32([0.2126, 0.7152, 0.0722])
    sh = np.clip(1 - l2 / 0.45, 0, 1)[..., None]
    out = out + sh * np.float32([-0.018, -0.004, 0.030])
    return np.clip(out, 0, 1)


def grade_v1(rgb):
    """Ben for the navy studio: cooler, cleaner, a bit more contrast."""
    rgb = rgb * np.float32([0.90, 0.98, 1.12])
    lum = rgb @ np.float32([0.2126, 0.7152, 0.0722])
    rgb = lum[..., None] + (rgb - lum[..., None]) * 0.96
    rgb = np.clip(rgb * 1.06, 0, 1)
    out = smooth_s(rgb, 0.38)
    l2 = out @ np.float32([0.2126, 0.7152, 0.0722])
    sh = np.clip(1 - l2 / 0.4, 0, 1)[..., None]
    out = out + sh * np.float32([-0.02, -0.006, 0.035])
    return np.clip(out, 0, 1)


def hex_rgb(h):
    h = h.lstrip("#")
    return np.float32([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


# studio backdrop for v1 (static base; the graphics back layer adds motion)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
top, bot = hex_rgb("#13215a"), hex_rgb("#0a1338")
studio = top + (bot - top) * (yy / H)[..., None]
d = np.sqrt(((xx - W * 0.52) / (W * 0.42)) ** 2 + ((yy - H * 0.40) / (H * 0.62)) ** 2)
glow = np.clip(1 - d, 0, 1) ** 1.6
studio = studio + glow[..., None] * (hex_rgb("#2b45c2") - studio) * 0.85
# faint 64px grid, like the site's panels
grid = (((xx % 64) < 1.2) | ((yy % 64) < 1.2)).astype(np.float32) * 0.035
studio = np.clip(studio + grid[..., None] * (1 - glow[..., None] * 0.6), 0, 1).astype(np.float32)

vig = np.clip(1 - 0.22 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.2, 0, 1)[..., None].astype(np.float32)

rng = np.random.default_rng(7)
GRAIN = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
GRAIN = [cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)[..., None] for g in GRAIN]
RIM = hex_rgb("#7f98ff")


def load_rgba(p):
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if im is None:
        return None, None
    if im.ndim == 2:
        im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
    if im.shape[2] == 3:  # fully opaque frames come out without an alpha channel
        return im[..., ::-1].astype(np.float32) / 255, np.ones((H, W, 1), np.float32)
    a = im[..., 3:4].astype(np.float32) / 255
    if a.max() == 0:
        return None, None
    rgb = im[..., 2::-1].astype(np.float32) / 255
    return rgb, a


def frame(f, plate_bgr, alpha8):
    t = f / FPS
    M, s = affine(t)
    rgb = plate_bgr[..., ::-1].astype(np.float32) / 255
    a = alpha8.astype(np.float32) / 255
    if V1:
        ben = grade_v1(rgb)
    else:
        ben = grade_v2(rgb, a)
    # 720p -> 1080p with the shot's zoom/position
    big = cv2.warpAffine(ben, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    A = cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)[..., None]
    # mild sharpen to offset the enlargement
    amt = 0.35 + 0.35 * (s - 1) / 0.22
    blur = cv2.GaussianBlur(big, (0, 0), 1.2)
    big = np.clip(big + (big - blur) * amt, 0, 1)

    if V1:
        base = studio.copy()
        # rim light + spill suppression on the matte edge
        Ab = cv2.GaussianBlur(A[..., 0], (0, 0), 6)[..., None]
        edge = np.clip(A - Ab, 0, 1) * 2.2
        big = big * (1 - edge * 0.35) + RIM * edge * 0.55
        # gentle shadow of Ben on the backdrop for depth
        sh = cv2.GaussianBlur(A[..., 0], (0, 0), 28)[..., None]
        sh = cv2.warpAffine(sh, np.float32([[1, 0, 10], [0, 1, 18]]), (W, H))[..., None]
        base = base * (1 - sh * 0.35)
    else:
        base = big
    back_rgb, back_a = load_rgba(f"{args.gfx}/back/{f:05d}.png")
    if back_rgb is not None:
        base = base * (1 - back_a) + back_rgb * back_a
    out = base * (1 - A) + big * A
    out = out * vig
    front_rgb, front_a = load_rgba(f"{args.gfx}/front/{f:05d}.png")
    if front_rgb is not None:
        out = out * (1 - front_a) + front_rgb * front_a
    out = out + GRAIN[f % len(GRAIN)] * 0.012
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


def main():
    if args.at:
        want = sorted(int(x) for x in args.at.split(","))
    else:
        want = list(range(TOTAL))
    cap = cv2.VideoCapture("build/aroll.mp4")
    acap = cv2.VideoCapture("build/alpha.mkv")
    enc = None
    if not args.stills:
        out = args.out or f"build/{args.version}_picture.mp4"
        enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                                "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "15",
                                "-pix_fmt", "yuv420p", "-g", "60", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    else:
        os.makedirs(args.stills, exist_ok=True)
    wi = 0
    for f in range(max(want) + 1):
        ok, plate = cap.read()
        ok2, al = acap.read()
        if not (ok and ok2):
            break
        if f != want[wi]:
            continue
        img = frame(f, plate, al[..., 0])
        if enc:
            enc.stdin.write(img.tobytes())
        else:
            cv2.imwrite(f"{args.stills}/{args.version}_{f:05d}.jpg", img[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 92])
        wi += 1
        if wi % 200 == 0:
            print(f"{args.version}: {wi}/{len(want)}", flush=True)
        if wi >= len(want):
            break
    if enc:
        enc.stdin.close()
        enc.wait()


if __name__ == "__main__":
    main()

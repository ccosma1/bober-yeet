"""Chroma P8 story props + hurt Bobers onto transparent PNG."""
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\calle\.grok\sessions\C%3A%5CUsers%5Ccalle\01a0bf33-605e-7eb2-bb49-9384916651e4\images")
DST = Path(__file__).resolve().parents[1] / "assets" / "sprites"

JOBS = [
    ("21.jpg", "bober-limp.png", 512, "black"),
    ("22.jpg", "bober-kneel.png", 512, "black"),
    ("20.jpg", "story-jet.png", 384, "magenta"),
    ("18.jpg", "story-lander.png", 384, "magenta"),
    ("17.jpg", "story-probe.png", 320, "magenta"),
    ("16.jpg", "story-drone.png", 384, "magenta"),
    ("19.jpg", "story-torch.png", 384, "magenta"),
]


def is_magenta(r, g, b):
    if r < 140 or g >= r - 10 or b < 70:
        return False
    if b > g + 15 and r > g + 40:
        return True
    if r > 180 and b > 80 and g < 110:
        return True
    return False


def is_black(r, g, b):
    return r < 22 and g < 22 and b < 22


def key_image(im, mode):
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    op = out.load()
    pred = is_black if mode == "black" else is_magenta
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            op[x, y] = (0, 0, 0, 0) if pred(r, g, b) else (r, g, b, 255)
    seen = [[False] * w for _ in range(h)]
    q = deque()

    def try_push(x, y):
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            return
        r, g, b, a = op[x, y]
        if a == 0 or pred(r, g, b):
            seen[y][x] = True
            q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)
    while q:
        x, y = q.popleft()
        op[x, y] = (0, 0, 0, 0)
        try_push(x - 1, y)
        try_push(x + 1, y)
        try_push(x, y - 1)
        try_push(x, y + 1)
    return out


def tight_crop(im, pad=12):
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def fit_max(im, max_side):
    m = max(im.size)
    if m <= max_side:
        return im
    s = max_side / m
    return im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.Resampling.LANCZOS)


def main():
    DST.mkdir(parents=True, exist_ok=True)
    for src_name, dest_name, max_side, mode in JOBS:
        im = key_image(Image.open(SRC / src_name), mode)
        im = tight_crop(im, 16)
        im = fit_max(im, max_side)
        dest = DST / dest_name
        im.save(dest, "PNG")
        a = im.getchannel("A")
        z = sum(1 for v in a.getdata() if v == 0)
        print("%s %s trans=%d" % (dest_name, im.size, z))


if __name__ == "__main__":
    main()

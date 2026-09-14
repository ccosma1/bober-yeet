"""Chroma-key hot-pink / magenta sprites to transparent PNG."""
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\calle\.grok\sessions\C%3A%5CUsers%5Ccalle\01a0a0a5-0c86-7a30-a2ac-4e4dcdb18fa5\images")
DST = Path(r"C:\Users\calle\Desktop\projects\bober-yeet\assets\sprites")
DST.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("2.jpg", "bober-idle.png", 512),
    ("4.jpg", "bober-fly.png", 640),
    ("5.jpg", "bober-splat.png", 512),
    ("7.jpg", "slingshot.png", 512),
    ("1.jpg", "star.png", 256),
    ("6.jpg", "splash-hero.png", 512),
]


def is_key_color(r, g, b) -> bool:
    # Hot pink / magenta only — not brown wood, gold, cream, or snow.
    if r < 140 or g >= r - 10 or b < 70:
        return False
    if b > g + 15 and r > g + 40:
        return True
    if r > 180 and b > 80 and g < 110:
        return True
    return False


def chroma_key(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            op[x, y] = (0, 0, 0, 0) if is_key_color(r, g, b) else (r, g, b, 255)

    seen = [[False] * w for _ in range(h)]
    q = deque()

    def try_push(x, y):
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            return
        r, g, b, a = op[x, y]
        if a == 0 or is_key_color(r, g, b):
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

    for _ in range(3):
        cur = out.copy()
        cp = cur.load()
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                r, g, b, a = cp[x, y]
                if a == 0:
                    continue
                trans = 0
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    if cp[x + dx, y + dy][3] == 0:
                        trans += 1
                if trans == 0:
                    continue
                pink = r > 90 and b > 55 and g < 150 and r + b > g * 1.45
                dark = r < 55 and g < 55 and b < 55
                if pink and not dark:
                    op[x, y] = (0, 0, 0, 0)
                elif dark:
                    op[x, y] = (12, 10, 14, 255)
    return out


def tight_crop(im: Image.Image, pad: int = 12) -> Image.Image:
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def fit_max(im: Image.Image, max_side: int) -> Image.Image:
    m = max(im.size)
    if m <= max_side:
        return im
    s = max_side / m
    return im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.Resampling.LANCZOS)


def main():
    for src_name, dest_name, max_side in JOBS:
        im = Image.open(SRC / src_name)
        im = chroma_key(im)
        im = tight_crop(im, 16)
        im = fit_max(im, max_side)
        dest = DST / dest_name
        im.save(dest, "PNG")
        print(f"{dest_name}: {im.size}")


if __name__ == "__main__":
    main()

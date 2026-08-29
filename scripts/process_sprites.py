"""Chroma-key magenta sprites to transparent PNG, flip Bober to face right."""
from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\calle\.grok\sessions\C%3A%5CUsers%5Ccalle\01a04cc3-80c9-75f3-b198-55b46073d4ba\images")
DST = Path(r"C:\Users\calle\Desktop\projects\bober-yeet\assets\sprites")
DST.mkdir(parents=True, exist_ok=True)

JOBS = [
    ("4.jpg", "bober-idle.png", True),
    ("6.jpg", "bober-fly.png", True),
    ("7.jpg", "bober-splat.png", False),
    ("5.jpg", "uranus.png", False),
    ("2.jpg", "slingshot.png", False),
    ("3.jpg", "star.png", False),
]


def is_magenta(r, g, b) -> bool:
    return r > 145 and b > 120 and g < 125 and (r + b) > g * 2.2 and min(r, b) > g + 20


def chroma_key(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            if is_magenta(r, g, b):
                op[x, y] = (0, 0, 0, 0)
            else:
                op[x, y] = (r, g, b, 255)
    # Eat JPEG magenta fringe along the cut
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
                pink = (r > 90 and b > 70 and g < 140 and r + b > g * 1.6)
                dark = r < 55 and g < 55 and b < 55
                if pink and not dark:
                    op[x, y] = (0, 0, 0, 0)
                elif dark:
                    op[x, y] = (12, 10, 14, 255)
    return out


def tight_crop(im: Image.Image, pad: int = 12) -> Image.Image:
    alpha = im.split()[-1]
    bbox = alpha.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def main():
    for src_name, dest_name, flip in JOBS:
        src = SRC / src_name
        im = Image.open(src)
        im = chroma_key(im)
        if flip:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        im = tight_crop(im, 16)
        dest = DST / dest_name
        im.save(dest, "PNG")
        print(f"{dest_name}: {im.size}")


if __name__ == "__main__":
    main()

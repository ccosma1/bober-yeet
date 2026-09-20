"""Phase 4: chroma new map plates, skies, item icons, History stills."""
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path(r"C:\Users\calle\.grok\sessions\C%3A%5CUsers%5Ccalle\01a0bf33-605e-7eb2-bb49-9384916651e4\images")
SPR = Path(__file__).resolve().parents[1] / "assets" / "sprites"
HIST = Path(__file__).resolve().parents[1] / "assets" / "history"
W, H = 1280, 720


def is_hot_magenta(r: int, g: int, b: int) -> bool:
    if r >= 200 and g <= 90 and b >= 90:
        return True
    if r >= 180 and g <= 70 and b >= 70 and r > g + 90:
        return True
    if r >= 210 and b >= 140 and g <= 120 and r + b > g * 2.6:
        return True
    if r + b - 2 * g > 220 and r > 160 and b > 80 and g < 110:
        return True
    return False


def chroma(im: Image.Image, size=None) -> Image.Image:
    if size:
        im = im.convert("RGBA").resize(size, Image.Resampling.LANCZOS)
    else:
        im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            op[x, y] = (0, 0, 0, 0) if is_hot_magenta(r, g, b) else (r, g, b, 255)
    seen = [[False] * w for _ in range(h)]
    q = deque()

    def push(x, y):
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            return
        r, g, b, a = op[x, y]
        if a == 0 or is_hot_magenta(r, g, b):
            seen[y][x] = True
            q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while q:
        x, y = q.popleft()
        op[x, y] = (0, 0, 0, 0)
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)
    return out


def stats(name: str, im: Image.Image) -> None:
    px = im.load()
    w, h = im.size
    first = h
    cols = []
    for x in (40, 120, 200, 320, 480, 640, 800, 960, 1120, 1240):
        if x >= w:
            continue
        fy = h
        for y in range(h):
            if px[x, y][3] > 40:
                fy = y
                break
        cols.append("%d:%d" % (x, fy))
        if fy < first:
            first = fy
    print(name, "snowline", first, "headroom", round(first / h, 3), " ".join(cols))


def compose(sky: Image.Image, ground: Image.Image, dest: Path, wash, wash_from: int) -> None:
    canvas = sky.convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    water = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wp = water.load()
    gp = ground.load()
    wr, wg, wb = wash
    for y in range(H):
        a = int(220 * min(1, max(0, (y - wash_from) / 70.0)))
        if a <= 0:
            continue
        t = max(0, min(1, (y - wash_from) / 220.0))
        r = int(wr * (1 - 0.45 * t))
        g = int(wg * (1 - 0.35 * t))
        b = int(wb * (1 - 0.2 * t))
        for x in range(W):
            if gp[x, y][3] <= 40:
                wp[x, y] = (r, g, b, a)
    canvas = Image.alpha_composite(Image.alpha_composite(canvas, water), ground)
    canvas.convert("RGB").save(dest, "JPEG", quality=90)
    print("still", dest.name)


def main() -> None:
    maps = [
        ("5.jpg", "acid-ground.png", "acid"),
        ("2.jpg", "ring-ground.png", "ring"),
        ("6.jpg", "pack-ground.png", "pack"),
        ("8.jpg", "frost-ground.png", "frost"),
        ("7.jpg", "dock-ground.png", "dock"),
    ]
    grounds = {}
    for src, dest, key in maps:
        g = chroma(Image.open(SRC / src), (W, H))
        g.save(SPR / dest)
        stats(key, g)
        grounds[key] = g

    skies = {}
    for src, dest, key in (
        ("3.jpg", "sky-venus.jpg", "venus"),
        ("4.jpg", "sky-saturn.jpg", "saturn"),
        ("1.jpg", "sky-neptune.jpg", "neptune"),
        ("9.jpg", "sky-pluto.jpg", "pluto"),
        ("12.jpg", "sky-asteroid.jpg", "asteroid"),
    ):
        im = Image.open(SRC / src).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
        im.save(SPR / dest, "JPEG", quality=88)
        skies[key] = im
        print("sky", dest)

    for src, dest in (
        ("11.jpg", "pinecone.png"),
        ("13.jpg", "woodchip-mine.png"),
        ("10.jpg", "bark-buckler.png"),
    ):
        icon = chroma(Image.open(SRC / src), (512, 512))
        icon.save(SPR / dest)
        print("icon", dest, icon.size)

    compose(skies["venus"], grounds["acid"], HIST / "acid-vents.jpg", (160, 180, 40), 520)
    compose(skies["saturn"], grounds["ring"], HIST / "ring-span.jpg", (12, 12, 18), 500)
    compose(skies["neptune"], grounds["pack"], HIST / "deep-pack.jpg", (20, 50, 110), 560)
    compose(skies["pluto"], grounds["frost"], HIST / "frost-pit.jpg", (40, 70, 110), 520)
    compose(skies["asteroid"], grounds["dock"], HIST / "dock-notch.jpg", (8, 8, 12), 480)
    print("ok")


if __name__ == "__main__":
    main()

"""Re-key Twin Ledges + Lodge Bowl plates from hot-magenta stills. Preserve ice."""
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

SRC = Path(r"C:\Users\calle\.grok\sessions\C%3A%5CUsers%5Ccalle\01a0bdc0-aa93-7240-b33f-cdeb9ae1a1d2\images")
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
    sat = r + b - 2 * g
    if sat > 220 and r > 160 and b > 80 and g < 110:
        return True
    return False


def chroma(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA").resize((W, H), Image.Resampling.LANCZOS)
    px = im.load()
    out = Image.new("RGBA", (W, H))
    op = out.load()
    for y in range(H):
        for x in range(W):
            r, g, b, _ = px[x, y]
            op[x, y] = (0, 0, 0, 0) if is_hot_magenta(r, g, b) else (r, g, b, 255)

    seen = [[False] * W for _ in range(H)]
    q = deque()

    def push(x, y):
        if x < 0 or y < 0 or x >= W or y >= H or seen[y][x]:
            return
        r, g, b, a = op[x, y]
        if a == 0 or is_hot_magenta(r, g, b):
            seen[y][x] = True
            q.append((x, y))

    for x in range(W):
        push(x, 0)
        push(x, H - 1)
    for y in range(H):
        push(0, y)
        push(W - 1, y)
    while q:
        x, y = q.popleft()
        op[x, y] = (0, 0, 0, 0)
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)

    # fringe: magenta-ish next to holes becomes transparent
    for _ in range(2):
        cur = out.copy()
        cp = cur.load()
        for y in range(1, H - 1):
            for x in range(1, W - 1):
                r, g, b, a = cp[x, y]
                if a == 0:
                    continue
                holes = 0
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    if cp[x + dx, y + dy][3] == 0:
                        holes += 1
                if not holes:
                    continue
                pink = r > 110 and b > 70 and g < 160 and r + b > g * 1.35
                if pink or holes >= 3:
                    op[x, y] = (0, 0, 0, 0)

    # leftover chroma in the ditch / sky holes — never keep as opaque purple
    for y in range(H):
        for x in range(W):
            r, g, b, a = op[x, y]
            if a == 0:
                continue
            snow = g >= r - 12 and g >= b - 30 and r > 150
            dirt = r > g + 15 and g > b and r < 200
            ice = r + g + b > 500 and b >= g - 8 and g > 155
            pink = r > 90 and b > 65 and g < 175 and r + b > g * 1.32
            if pink and not snow and not dirt and not ice:
                op[x, y] = (0, 0, 0, 0)
    return out


def punch_dark_creek(im: Image.Image) -> Image.Image:
    """Drop creek leftover chroma and isolated dark rims in the valley."""
    px = im.load()
    for y in range(300, H):
        for x in range(400, 900):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            ice = r + g + b > 420 and b >= g - 12 and g > 140
            snow = g >= r - 14 and r > 150
            dirt = r >= g and g >= b - 12
            chroma = r > 110 and b > 80 and g < 170 and r + b > g * 1.4 and b > g + 8
            if chroma and not ice and not snow and not dirt:
                px[x, y] = (0, 0, 0, 0)
    return im


def close_alpha_holes(im: Image.Image, box) -> Image.Image:
    """Fill tiny holes inside the ice slab so the bridge stays solid."""
    x0, y0, x1, y1 = box
    region = im.crop((x0, y0, x1, y1))
    a = region.split()[-1]
    solid = a.point(lambda v: 255 if v > 40 else 0)
    solid = solid.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    px = region.load()
    sp = solid.load()
    for y in range(region.height):
        for x in range(region.width):
            r, g, b, aa = px[x, y]
            if sp[x, y] >= 200 and aa <= 40:
                px[x, y] = (200, 220, 235, 255)
            elif aa > 40 and r > 140 and b > 80 and g < r - 10:
                px[x, y] = (min(255, int(r * 0.4 + 180 * 0.6)), min(255, int(g * 0.3 + 215 * 0.7)), min(255, int(b * 0.2 + 235 * 0.8)), 255)
    im.paste(region, (x0, y0))
    return im


def compose_still(sky: Image.Image, ground: Image.Image, dest: Path) -> None:
    sky = sky.convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    canvas = sky.convert("RGBA")
    # deep water wash in transparent valley
    water = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    wp = water.load()
    gp = ground.load()
    for y in range(H):
        t = (y - 480) / 240.0
        if t < 0:
            t = 0
        if t > 1:
            t = 1
        r = int(18 + 22 * (1 - t))
        g = int(70 + 50 * (1 - t))
        b = int(110 + 30 * (1 - t))
        a = int(230 * min(1, max(0, (y - 390) / 70.0)))
        for x in range(W):
            if gp[x, y][3] <= 40 and y > 360:
                wp[x, y] = (r, g, b, a)
    canvas = Image.alpha_composite(canvas, water)
    canvas = Image.alpha_composite(canvas, ground)
    canvas.convert("RGB").save(dest, "JPEG", quality=90)
    print("still", dest.name)


def main() -> None:
    ledges = chroma(Image.open(SRC / "19.jpg"))
    ledges = punch_dark_creek(ledges)
    ledges = close_alpha_holes(ledges, (480, 340, 820, 560))
    bowl = chroma(Image.open(SRC / "18.jpg"))
    bowl = punch_dark_creek(bowl)

    ledges.save(SPR / "ledges-ground.png", "PNG")
    bowl.save(SPR / "bowl-ground.png", "PNG")
    print("ledges", ledges.size, "bowl", bowl.size)

    sky = Image.open(SPR / "stage-sky.jpg")
    compose_still(sky, ledges, HIST / "twin-ledges.jpg")
    compose_still(sky, bowl, HIST / "lodge-bowl.jpg")

    for name, im in (("ledges", ledges), ("bowl", bowl)):
        px = im.load()
        mag = pink = opaque = 0
        first = H
        for y in range(H):
            for x in range(W):
                r, g, b, a = px[x, y]
                if a > 40:
                    opaque += 1
                    if y < first:
                        first = y
                    if r > 140 and b > 70 and g < r - 20 and b > g:
                        mag += 1
                    if r > 90 and b > 55 and g < 150 and r + b > g * 1.45:
                        pink += 1
        print(name, "opaque", opaque, "magenta", mag, "pinkish", pink, "snowline", first, "headroom", round(first / H, 3))


if __name__ == "__main__":
    main()

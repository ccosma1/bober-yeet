"""Key P3 map plates and composite History stills."""
from collections import deque
from pathlib import Path

from PIL import Image

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
    if r + b - 2 * g > 220 and r > 160 and b > 80 and g < 110:
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
    for y in range(H):
        for x in range(W):
            r, g, b, a = op[x, y]
            if a == 0:
                continue
            snow = g >= r - 12 and r > 150
            dirt = r >= g and g >= b - 12
            ice = r + g + b > 420 and b >= g - 12 and g > 140
            pink = r > 110 and b > 80 and g < 170 and r + b > g * 1.4 and b > g + 8
            if pink and not snow and not dirt and not ice:
                op[x, y] = (0, 0, 0, 0)
    return out


def punch_dark_center(im: Image.Image, y0=280, y1=700, x0=380, x1=900, max_sum=90) -> Image.Image:
    px = im.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r + g + b <= max_sum:
                px[x, y] = (0, 0, 0, 0)
    return im


def span_width(im: Image.Image, top_frac=0.22) -> Image.Image:
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    crop = im.crop(bbox)
    target_w = W
    s = target_w / crop.width
    nh = max(1, int(crop.height * s))
    if nh > int(H * 0.78):
        nh = int(H * 0.78)
        s = nh / crop.height
        target_w = max(1, int(crop.width * s))
    crop = crop.resize((target_w, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - target_w) // 2
    y = H - nh - 8
    min_y = int(H * top_frac)
    if y < min_y:
        y = min_y
    canvas.paste(crop, (x, y), crop)
    return canvas


def save_sky(src_name: str, dest_name: str) -> Image.Image:
    im = Image.open(SRC / src_name).convert("RGB").resize((W, H), Image.Resampling.LANCZOS)
    im.save(SPR / dest_name, "JPEG", quality=88)
    print("sky", dest_name)
    return im


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


def stats(name: str, im: Image.Image) -> None:
    px = im.load()
    first = H
    cols = []
    for x in (80, 160, 240, 320, 640, 960, 1080, 1200):
        fy = H
        for y in range(H):
            if px[x, y][3] > 40:
                fy = y
                break
        cols.append("%d:%d" % (x, fy))
        if fy < first:
            first = fy
    print(name, "snowline", first, "headroom", round(first / H, 3), " ".join(cols))


def main() -> None:
    earth = Image.open(SPR / "stage-sky.jpg")
    mars = save_sky("21.jpg", "sky-mars.jpg")
    moon = save_sky("20.jpg", "sky-moon.jpg")
    uranus = save_sky("22.jpg", "sky-uranus.jpg")

    bowl = chroma(Image.open(SRC / "25.jpg"))
    bowl = punch_dark_center(bowl)
    bowl = span_width(bowl, 0.28)
    bowl.save(SPR / "bowl-ground.png")
    stats("bowl", bowl)

    mesa = chroma(Image.open(SRC / "24.jpg"))
    mesa.save(SPR / "mesa-ground.png")
    stats("mesa", mesa)

    crater = chroma(Image.open(SRC / "23.jpg"))
    crater.save(SPR / "crater-ground.png")
    stats("crater", crater)

    methane = chroma(Image.open(SRC / "26.jpg"))
    methane.save(SPR / "methane-ground.png")
    stats("methane", methane)

    ledges = Image.open(SPR / "ledges-ground.png").convert("RGBA")

    compose(earth, bowl, HIST / "lodge-bowl.jpg", (30, 80, 120), 430)
    compose(earth, ledges, HIST / "twin-ledges.jpg", (18, 70, 110), 500)
    compose(mars, mesa, HIST / "red-mesa.jpg", (120, 60, 30), 560)
    compose(moon, crater, HIST / "crater-rim.jpg", (12, 12, 18), 520)
    compose(uranus, methane, HIST / "methane-shelf.jpg", (10, 50, 70), 480)
    print("ok")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Bober Yeet War mark — 100-unit meshes, lofted club, chamfered beaver.

Paints a full-bleed night-purple square. No sling-V, no sword, no logs.
Pillow only. Design space is 100 x 100, then mapped to the face size.
"""

from __future__ import annotations

import struct
from io import BytesIO
from math import cos, hypot, radians, sin
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "icons"

# Named palette from BRAND_MARK.md
FUR = (0x8B, 0x5A, 0x2B, 255)
TOOTH = (0xF4, 0xE6, 0xC3, 255)
STICK = (0xF5, 0xC4, 0x00, 255)
SKY = (0x3A, 0x2A, 0x6A, 255)

# Support inks mixed from the four — stay off sibling palettes
INK = (0x28, 0x14, 0x0C, 255)
EAR = (0x6A, 0x42, 0x1E, 255)
FACE_BAR = (0x9C, 0x68, 0x34, 255)
EYE = (0x18, 0x10, 0x1C, 255)
STICK_DIM = (0xC2, 0x8E, 0x00, 255)
WRAP = (0x5A, 0x34, 0x14, 255)
GUM = (0xE2, 0xCC, 0x9A, 255)

FACES = (16, 24, 32, 48, 64, 128, 256)


Mesh = list[tuple[float, float]]


def rot(mesh: Mesh, deg: float) -> Mesh:
    a = radians(deg)
    ca, sa = cos(a), sin(a)
    return [(x * ca - y * sa, x * sa + y * ca) for x, y in mesh]


def mov(mesh: Mesh, dx: float, dy: float) -> Mesh:
    return [(x + dx, y + dy) for x, y in mesh]


def loft(samples: list[tuple[float, float]]) -> Mesh:
    """Closed side-view from (x, halfwidth) samples along +X."""
    top = [(x, -h) for x, h in samples]
    bot = [(x, h) for x, h in reversed(samples)]
    return top + bot


def chamfer(x0: float, y0: float, x1: float, y1: float, cut: float) -> Mesh:
    """Axis box with clipped corners — chocolate-bar, not a squircle."""
    w, h = x1 - x0, y1 - y0
    c = min(cut, w * 0.45, h * 0.45)
    return [
        (x0 + c, y0),
        (x1 - c, y0),
        (x1, y0 + c),
        (x1, y1 - c),
        (x1 - c, y1),
        (x0 + c, y1),
        (x0, y1 - c),
        (x0, y0 + c),
    ]


def puff(mesh: Mesh, amt: float) -> Mesh:
    """Push vertices away from the centroid. Convex meshes only."""
    if amt <= 0 or len(mesh) < 3:
        return mesh
    cx = sum(p[0] for p in mesh) / len(mesh)
    cy = sum(p[1] for p in mesh) / len(mesh)
    out: Mesh = []
    for x, y in mesh:
        dx, dy = x - cx, y - cy
        length = hypot(dx, dy) or 1.0
        out.append((x + dx / length * amt, y + dy / length * amt))
    return out


def fit(mesh: Mesh, size: int, inset: float) -> Mesh:
    usable = size * (1.0 - 2.0 * inset)
    origin = size * inset
    s = usable / 100.0
    return [(origin + x * s, origin + y * s) for x, y in mesh]


def ink_units(size: int) -> float:
    return max(2.0, 130.0 / size)


def blob(
    draw: ImageDraw.ImageDraw,
    mesh: Mesh,
    fill: tuple[int, int, int, int],
    size: int,
    inset: float,
    outline: tuple[int, int, int, int] | None = INK,
) -> None:
    if outline is not None:
        draw.polygon(fit(puff(mesh, ink_units(size)), size, inset), fill=outline)
    draw.polygon(fit(mesh, size, inset), fill=fill)


def club_body() -> Mesh:
    # Bat profile: fat knob, thick handle, fatter blunt barrel. No point, no fork.
    return loft(
        [
            (0.0, 3.0),
            (4.0, 10.0),
            (10.0, 13.0),
            (16.0, 12.5),
            (20.0, 8.6),
            (32.0, 8.2),
            (46.0, 8.6),
            (56.0, 11.5),
            (68.0, 15.8),
            (80.0, 17.4),
            (90.0, 16.6),
            (96.0, 13.0),
            (99.0, 7.5),
        ]
    )


def club_shade() -> Mesh:
    return loft(
        [
            (22.0, 2.6),
            (40.0, 2.8),
            (58.0, 4.4),
            (76.0, 6.6),
            (90.0, 6.0),
            (96.0, 3.0),
        ]
    )


def wrap_band(x0: float, x1: float, half: float) -> Mesh:
    return loft(
        [
            (x0, half * 0.72),
            (x0 + 1.4, half),
            (x1 - 1.4, half),
            (x1, half * 0.72),
        ]
    )


def plant_club(mesh: Mesh) -> Mesh:
    # Knob lower-left, barrel peeks beside the right cheek — under the teeth.
    return mov(rot(mesh, -17.0), 7.0, 90.0)


def paint_club(draw: ImageDraw.ImageDraw, size: int, inset: float) -> None:
    blob(draw, plant_club(club_body()), STICK, size, inset)
    blob(draw, plant_club(mov(club_shade(), 0.0, 4.6)), STICK_DIM, size, inset, None)
    blob(draw, plant_club(wrap_band(18.0, 27.5, 10.4)), WRAP, size, inset)
    blob(draw, plant_club(wrap_band(84.0, 94.0, 16.8)), WRAP, size, inset)


def paint_bober(draw: ImageDraw.ImageDraw, size: int, inset: float) -> None:
    blob(draw, chamfer(5.5, 22.0, 24.0, 47.0, 5.5), EAR, size, inset)
    blob(draw, chamfer(76.0, 22.0, 94.5, 47.0, 5.5), EAR, size, inset)
    blob(draw, chamfer(10.0, 28.5, 19.5, 41.0, 3.0), INK, size, inset, None)
    blob(draw, chamfer(80.5, 28.5, 90.0, 41.0, 3.0), INK, size, inset, None)

    blob(draw, chamfer(19.0, 9.0, 81.0, 61.0, 9.0), FUR, size, inset)
    blob(draw, chamfer(28.0, 14.0, 72.0, 21.5, 2.2), FACE_BAR, size, inset, None)

    blob(draw, chamfer(29.5, 22.0, 42.5, 37.0, 3.2), EYE, size, inset)
    blob(draw, chamfer(57.5, 22.0, 70.5, 37.0, 3.2), EYE, size, inset)
    blob(draw, chamfer(32.0, 24.0, 37.5, 29.5, 1.2), TOOTH, size, inset, None)
    blob(draw, chamfer(60.0, 24.0, 65.5, 29.5, 1.2), TOOTH, size, inset, None)

    blob(draw, chamfer(31.0, 40.0, 69.0, 67.0, 11.0), TOOTH, size, inset)
    blob(draw, chamfer(44.0, 46.5, 56.0, 56.5, 3.0), EYE, size, inset)
    blob(draw, chamfer(45.5, 47.8, 50.5, 52.0, 1.0), TOOTH, size, inset, None)

    blob(draw, chamfer(36.5, 58.0, 47.5, 85.5, 3.2), TOOTH, size, inset)
    blob(draw, chamfer(52.5, 58.0, 63.5, 85.5, 3.2), TOOTH, size, inset)
    blob(draw, chamfer(36.5, 56.5, 63.5, 64.5, 2.4), GUM, size, inset, None)


def paint(size: int, maskable: bool = False) -> Image.Image:
    im = Image.new("RGBA", (size, size), SKY)
    draw = ImageDraw.Draw(im)
    inset = 0.14 if maskable else 0.0
    paint_club(draw, size, inset)
    paint_bober(draw, size, inset)
    return im


def down(size: int, maskable: bool = False) -> Image.Image:
    master = 1024 if size >= 48 else 640
    hi = paint(master, maskable=maskable)
    if size == master:
        return hi
    how = Image.Resampling.BOX if size <= 64 else Image.Resampling.LANCZOS
    return hi.resize((size, size), how)


def write_png(path: Path, size: int, maskable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    down(size, maskable=maskable).save(path, "PNG")


def write_ico(path: Path) -> None:
    """ICO with one PNG payload per face. Pillow's ICO saver drops extras."""
    payloads: list[tuple[int, bytes]] = []
    for face in FACES:
        buf = BytesIO()
        down(face).save(buf, format="PNG")
        payloads.append((face, buf.getvalue()))
    count = len(payloads)
    header = struct.pack("<HHH", 0, 1, count)
    offset = 6 + 16 * count
    entries = bytearray()
    body = bytearray()
    for face, data in payloads:
        dim = 0 if face >= 256 else face
        entries.extend(struct.pack("<BBBBHHII", dim, dim, 0, 0, 1, 32, len(data), offset))
        body.extend(data)
        offset += len(data)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(header + bytes(entries) + bytes(body))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_png(OUT / "icon-192.png", 192)
    write_png(OUT / "icon-512.png", 512)
    write_png(OUT / "icon-maskable-512.png", 512, maskable=True)
    write_ico(OUT / "bober-yeet-war.ico")
    print(f"wrote {OUT / 'icon-192.png'}")
    print(f"wrote {OUT / 'icon-512.png'}")
    print(f"wrote {OUT / 'icon-maskable-512.png'}")
    print(f"wrote {OUT / 'bober-yeet-war.ico'}")


if __name__ == "__main__":
    main()

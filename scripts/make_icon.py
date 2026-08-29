#!/usr/bin/env python3
"""Paint the Bober Yeet app mark from polygons. Pillow only.

Layout (1024-unit sheet, then scaled):
  night-purple field
  yellow sling-V behind the chin
  squarish beaver head, cream snout, two buckteeth
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

# Brand hexes from BRAND_MARK.md
FUR = (0x8B, 0x5A, 0x2B, 255)
TOOTH = (0xF4, 0xE6, 0xC3, 255)
SLING = (0xF5, 0xC4, 0x00, 255)
SKY = (0x3A, 0x2A, 0x6A, 255)

# Clip-art inks that stay off the sibling palettes (no cyan, navy, oxblood, teal)
INK = (0x2A, 0x16, 0x0C, 255)
EAR = (0x6A, 0x43, 0x20, 255)
CHEEK = (0xA5, 0x6C, 0x38, 255)
EYE = (0x1A, 0x12, 0x28, 255)
SLING_SHADE = (0xC4, 0x8C, 0x00, 255)
GUM = (0xE8, 0xC9, 0x96, 255)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "icons"

SHEET = 1024


def _px(n: float, size: int) -> int:
    return int(round(n * size / SHEET))


def _xy(pt: tuple[float, float], size: int) -> tuple[int, int]:
    return (_px(pt[0], size), _px(pt[1], size))


def _box(a: tuple[float, float], b: tuple[float, float], size: int) -> tuple[int, int, int, int]:
    x0, y0 = _xy(a, size)
    x1, y1 = _xy(b, size)
    return (x0, y0, x1, y1)


def _offset(p: tuple[float, float], q: tuple[float, float], dist: float) -> list[tuple[float, float]]:
    dx, dy = q[0] - p[0], q[1] - p[1]
    length = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / length * dist, dx / length * dist
    return [
        (p[0] + nx, p[1] + ny),
        (p[0] - nx, p[1] - ny),
        (q[0] - nx, q[1] - ny),
        (q[0] + nx, q[1] + ny),
    ]


def _capsule(draw: ImageDraw.ImageDraw, p: tuple[float, float], q: tuple[float, float],
             radius: float, fill, size: int, outline=None, ink_w: float = 0) -> None:
    if outline and ink_w:
        poly = [_xy(pt, size) for pt in _offset(p, q, radius + ink_w)]
        draw.polygon(poly, fill=outline)
        r = _px(radius + ink_w, size)
        draw.ellipse((_xy(p, size)[0] - r, _xy(p, size)[1] - r,
                      _xy(p, size)[0] + r, _xy(p, size)[1] + r), fill=outline)
        draw.ellipse((_xy(q, size)[0] - r, _xy(q, size)[1] - r,
                      _xy(q, size)[0] + r, _xy(q, size)[1] + r), fill=outline)
    poly = [_xy(pt, size) for pt in _offset(p, q, radius)]
    draw.polygon(poly, fill=fill)
    r = _px(radius, size)
    cx, cy = _xy(p, size)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)
    cx, cy = _xy(q, size)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)


def _round_block(draw: ImageDraw.ImageDraw, a, b, radius: float, fill, size: int,
                 outline=None, ink_w: float = 0) -> None:
    if outline and ink_w:
        draw.rounded_rectangle(
            _box((a[0] - ink_w, a[1] - ink_w), (b[0] + ink_w, b[1] + ink_w), size),
            radius=_px(radius + ink_w, size),
            fill=outline,
        )
    draw.rounded_rectangle(_box(a, b, size), radius=_px(radius, size), fill=fill)


def _ellipse(draw: ImageDraw.ImageDraw, a, b, fill, size: int,
             outline=None, ink_w: float = 0) -> None:
    if outline and ink_w:
        draw.ellipse(
            _box((a[0] - ink_w, a[1] - ink_w), (b[0] + ink_w, b[1] + ink_w), size),
            fill=outline,
        )
    draw.ellipse(_box(a, b, size), fill=fill)


def paint_sling(draw: ImageDraw.ImageDraw, size: int, pad: float) -> None:
    """True sling-V: two thick forks meet at an apex under the teeth."""
    ink = 18
    apex = (512.0, 900.0 - pad * 0.35)
    left_tip = (108.0 + pad, 470.0)
    right_tip = (916.0 - pad, 470.0)
    _capsule(draw, left_tip, apex, 64, SLING, size, INK, ink)
    _capsule(draw, right_tip, apex, 64, SLING, size, INK, ink)
    # Flat inner strip — wood fork, not a glow
    _capsule(draw, left_tip, apex, 22, SLING_SHADE, size)
    _capsule(draw, right_tip, apex, 22, SLING_SHADE, size)
    # Rubber pouch the beaver sits in (band across the V crotch)
    _capsule(draw, (300.0, 700.0), (724.0, 700.0), 42, SLING, size, INK, 14)
    _capsule(draw, (330.0, 700.0), (694.0, 700.0), 18, SLING_SHADE, size)


def paint_bober(draw: ImageDraw.ImageDraw, size: int, pad: float) -> None:
    ink = 20
    # Blocky side ears, inset on maskable so circular crops keep them
    le_a, le_b = (96 + pad, 248), (248 + pad * 0.15, 468)
    re_a, re_b = (776 - pad * 0.15, 248), (928 - pad, 468)
    _round_block(draw, le_a, le_b, 50, EAR, size, INK, ink)
    _round_block(draw, re_a, re_b, 50, EAR, size, INK, ink)
    _ellipse(
        draw,
        (le_a[0] + 28, le_a[1] + 40),
        (le_b[0] - 18, le_b[1] - 36),
        INK,
        size,
    )
    _ellipse(
        draw,
        (re_a[0] + 18, re_a[1] + 40),
        (re_b[0] - 28, re_b[1] - 36),
        INK,
        size,
    )

    head_l, head_t = 196 + pad * 0.35, 128 + pad * 0.3
    head_r, head_b = 828 - pad * 0.35, 672
    _round_block(draw, (head_l, head_t), (head_r, head_b), 82, FUR, size, INK, ink)

    # Flat cheek slab — clip-art, not a glow orb
    _round_block(
        draw,
        (head_l + 36, head_t + 70),
        (head_r - 36, 430),
        60,
        CHEEK,
        size,
    )
    _round_block(
        draw,
        (head_l + 58, head_t + 92),
        (head_r - 58, 412),
        50,
        FUR,
        size,
    )

    _ellipse(draw, (300, 400), (724, 678), TOOTH, size, INK, ink)

    # Smaller high-set eyes so the snout + teeth own the beaver read
    _ellipse(draw, (328, 228), (440, 360), EYE, size, INK, 8)
    _ellipse(draw, (584, 228), (696, 360), EYE, size, INK, 8)
    _ellipse(draw, (364, 248), (412, 296), TOOTH, size)
    _ellipse(draw, (620, 248), (668, 296), TOOTH, size)

    _ellipse(draw, (448, 428), (576, 516), INK, size)
    _ellipse(draw, (468, 440), (524, 478), TOOTH, size)

    gap, tooth_w = 18, 88
    left = 512 - gap / 2 - tooth_w
    right = 512 + gap / 2
    _round_block(draw, (left, 592), (left + tooth_w, 792), 16, TOOTH, size, INK, 14)
    _round_block(draw, (right, 592), (right + tooth_w, 792), 16, TOOTH, size, INK, 14)
    _round_block(draw, (left + 6, 592), (right + tooth_w - 6, 630), 8, GUM, size)


def render(size: int, maskable: bool = False) -> Image.Image:
    im = Image.new("RGBA", (size, size), SKY)
    draw = ImageDraw.Draw(im)
    pad = 90 if maskable else 0
    paint_sling(draw, size, pad)
    paint_bober(draw, size, pad)
    return im


def render_crisp(size: int, maskable: bool = False) -> Image.Image:
    """Paint oversized, then box-filter down so clip-art edges stay chunky."""
    master = 1024 if size >= 64 else 512
    hi = render(master, maskable=maskable)
    if size == master:
        return hi
    return hi.resize((size, size), Image.Resampling.LANCZOS)


def write_png(path: Path, size: int, maskable: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    render_crisp(size, maskable=maskable).save(path, "PNG")


def write_ico(path: Path) -> None:
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img = render_crisp(256)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="ICO", sizes=sizes)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_png(OUT / "icon-192.png", 192)
    write_png(OUT / "icon-512.png", 512)
    write_png(OUT / "icon-maskable-512.png", 512, maskable=True)
    write_ico(OUT / "bober-yeet.ico")
    print(f"wrote {OUT / 'icon-192.png'}")
    print(f"wrote {OUT / 'icon-512.png'}")
    print(f"wrote {OUT / 'icon-maskable-512.png'}")
    print(f"wrote {OUT / 'bober-yeet.ico'}")


if __name__ == "__main__":
    main()

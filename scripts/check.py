#!/usr/bin/env python3
"""Static honesty + v1 scope checks for Bober Yeet War."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAILS: list[str] = []


def read(rel: str) -> str:
    p = ROOT / rel
    if not p.exists():
        FAILS.append("missing " + rel)
        return ""
    return p.read_text(encoding="utf-8")


def must(hay: str, needle: str, where: str) -> None:
    if needle not in hay:
        FAILS.append("%s missing %r" % (where, needle))


def must_re(hay: str, pattern: str, where: str) -> None:
    if not re.search(pattern, hay):
        FAILS.append("%s missing /%s/" % (where, pattern))


def forbid(hay: str, needle: str, where: str) -> None:
    if needle.lower() in hay.lower():
        FAILS.append("%s contains forbidden %r" % (where, needle))


def main() -> int:
    html = read("index.html")
    css = read("css/game.css")
    game = read("js/game.js")
    lore = read("js/lore.js")
    readme = read("README.md")
    splash = html[html.find('id="splash"') : html.find('id="howto"')]

    must(html, "Bober Yeet War", "index.html")
    must(html, "BOBER YEET WAR", "index.html")
    must(html, "Aim, power, wind. Dig cover. Last beaver standing.", "index.html")
    must(html, "Fan game by a holder.", "index.html")
    must(html, ">START<", "index.html")
    must(html, "HOW TO PLAY", "index.html")
    must(html, "Yeet Stick", "index.html")
    must(html, "Snowball", "index.html")
    must(html, "Dynamite", "index.html")
    must(html, "Sap Bomb", "index.html")
    must(html, "angle · power · wind flag · Fire", "index.html")
    must(html, "You cannot buy a win", "index.html")
    must(html, 'id="btn-fire"', "index.html")
    must(html, "REMATCH", "index.html")
    must(html, "SPLASH", "index.html")
    must(html, "MUSEUM", "index.html")
    must(html, "HISTORY", "index.html")
    must(html, "$BOBER", "index.html")

    must(css, "min-height: 55vh", "game.css")
    must(css, "min-height: 56px", "game.css")

    must(game, "const HP_MAX = 100", "game.js")
    must(game, 'name: "Yeet Stick", dmg: 25, blast: 28', "game.js")
    must(game, 'name: "Snowball", dmg: 15, blast: 36', "game.js")
    must(game, 'name: "Dynamite", dmg: 45, blast: 48', "game.js")
    must(game, 'name: "Sap Bomb", dmg: 30, blast: 40', "game.js")
    must(game, "const FUSE_SEC = 2", "game.js")
    must(game, "const SAP_TICKS = 2", "game.js")
    must(game, "const CRATE_EVERY = 3", "game.js")
    must(game, "const DYN_COST = 12", "game.js")
    must(game, "const SAP_COST = 10", "game.js")
    must_re(game, r"return \(Math\.random\(\) \* 9 \| 0\) - 4", "game.js")
    must(game, "xs: [108, 236, 364]", "game.js")
    must(game, "xs: [916, 1044, 1172]", "game.js")
    must(game, "carve(", "game.js")
    must(game, "b.airborne = false", "game.js")
    must(game, "flying ? img.fly : img.idle", "game.js")
    must(game, "function maybeEnd(", "game.js")
    must(game, "YOU WIN", "game.js")
    must(game, "YOU LOSE", "game.js")
    must(game, "function fightSpan(", "game.js")

    must(lore, "was Yeet", "lore.js")
    must(lore, "Was Yeet", "lore.js")
    must(lore, "assets/history/was-yeet.jpg", "lore.js")
    must(lore, "assets/history/bank-fight.jpg", "lore.js")
    must(readme, "Bober Yeet War", "README.md")

    for path, text in (
        ("index.html", html),
        ("js/game.js", game),
        ("js/lore.js", lore),
        ("README.md", readme),
    ):
        for bad in ("Worms", "Team17", "Team 17"):
            forbid(text, bad, path)
    forbid(splash, "wallet", "splash")
    forbid(splash, "gacha", "splash")
    forbid(splash, "100 levels", "splash")
    forbid(html, "matter.min.js", "index.html")
    forbid(html, "js/levels.js", "index.html")
    forbid(html, "js/scores.js", "index.html")

    for rel in (
        "assets/sprites/yeet-stick.png",
        "assets/sprites/snowball.png",
        "assets/sprites/dynamite.png",
        "assets/sprites/sap-bomb.png",
        "assets/sprites/crate.png",
        "assets/sprites/splash-hero.png",
        "assets/sprites/bober-idle.png",
        "assets/history/was-yeet.jpg",
        "assets/history/bank-fight.jpg",
        "assets/history/aim-wind.jpg",
        "assets/history/crate-gear.jpg",
        "assets/icons/bober-yeet-war.ico",
    ):
        if not (ROOT / rel).exists():
            FAILS.append("missing " + rel)

    if FAILS:
        print("CHECK_FAIL")
        for f in FAILS:
            print(" -", f)
        return 1
    print("CHECK_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())

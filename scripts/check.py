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
    must(html, "Bank fights from the Green Home to deep space.", "index.html")
    must(html, ">START<", "index.html")
    must(html, "HOW TO PLAY", "index.html")
    must(html, "Yeet Stick", "index.html")
    forbid(html, "Snowball", "index.html")
    forbid(html, "Ice Brace", "index.html")
    forbid(html, "Bark Buckler", "index.html")
    must(html, "Sap Snare", "index.html")
    must(html, "Stun Cone", "index.html")
    must(html, "Grav Lure", "index.html")
    must(html, "Dynamite", "index.html")
    must(html, "Sap Bomb", "index.html")
    must(html, "Lodge Mortar", "index.html")
    must(html, "Pinecone Cluster", "index.html")
    must(html, "Woodchip Mine", "index.html")
    must(html, "Corkscrew Rocket", "index.html")
    must(html, "Lodge Chaingun", "index.html")
    must(html, "Arc Zap", "index.html")
    must(html, "Ricochet Fang", "index.html")
    must(html, "Ember Cascade", "index.html")
    must(html, "55 $BOBER", "index.html")
    must(html, "42 $BOBER", "index.html")
    must(html, "60 $BOBER", "index.html")
    must(html, "turn 16", "index.html")
    must(html, 'id="w-rocket"', "index.html")
    must(html, 'id="w-chain"', "index.html")
    must(html, 'id="buy-rocket"', "index.html")
    must(html, 'id="buy-chain"', "index.html")
    must(html, "50 $BOBER", "index.html")
    must(html, "48 $BOBER", "index.html")
    must(html, "Lodge Bowl", "index.html")
    must(html, "Twin Ledges", "index.html")
    must(html, "Red Mesa", "index.html")
    must(html, "Crater Rim", "index.html")
    must(html, "Methane Shelf", "index.html")
    must(html, "Acid Vents", "index.html")
    must(html, "Ring Span", "index.html")
    must(html, "Deep Pack", "index.html")
    must(html, "Frost Pit", "index.html")
    must(html, "Dock Notch", "index.html")
    must(html, "angle · power · wind flag · Fire", "index.html")
    must(html, "You cannot buy a win", "index.html")
    must(html, 'id="btn-fire"', "index.html")
    must(html, "REMATCH", "index.html")
    must(html, "SPLASH", "index.html")
    must(html, "MUSEUM", "index.html")
    must(html, "HISTORY", "index.html")
    must(html, "$BOBER", "index.html")
    must(html, 'id="btn-shop"', "index.html")
    must(html, 'id="tray-l"', "index.html")
    must(html, 'id="tray-r"', "index.html")
    must(html, "EASY", "index.html")
    must(html, "NORMAL", "index.html")
    must(html, "HARD", "index.html")
    must(html, "SUDDEN DEATH", "index.html")
    must(html, "Sudden Death", "index.html")
    must(html, "Each bank has its own scrap", "index.html")
    must(html, 'id="map-story"', "index.html")
    must(html, 'id="story-strip"', "index.html")
    must(html, "Starfall over the Green Home bowl.", "index.html")
    must(html, "LINK BATTLE", "index.html")
    must(html, "VS AI", "index.html")
    must(html, ">HOST<", "index.html")
    must(html, ">JOIN<", "index.html")
    must(html, "Room code", "index.html")
    must(html, "OPPONENT DISCONNECTED", "index.html")
    must(html, "PeerJS", "index.html")
    forbid(html, "hotseat", "index.html")
    must(html, 'title="$BOBER"', "index.html")
    forbid(html, 'id="coin-chip" title="Shop"', "index.html")
    forbid(html, "tilt-play", "index.html")
    forbid(html, "PLAY ANYWAY", "index.html")
    forbid(html, "tilt to landscape", "index.html")

    must(css, "min-height: 55vh", "game.css")
    must(css, "min-height: 62dvh", "game.css")
    must(css, "min-height: 56px", "game.css")
    must(css, "max-height: 28dvh", "game.css")
    must(css, "overflow-x: auto", "game.css")
    must(css, "env(safe-area-inset-bottom)", "game.css")
    must(css, "object-fit: cover", "game.css")
    must(css, "tray-chev", "game.css")
    must(css, "-webkit-touch-callout: none", "game.css")
    must(css, "touch-action: none", "game.css")
    must(css, "-webkit-user-select: none", "game.css")
    forbid(css, "portrait-block", "game.css")
    forbid(css, ".weapons { grid-template-columns", "game.css")

    must(game, "const HP_MAX = 85", "game.js")
    must(game, 'name: "Yeet Stick", dmg: 25, blast: 28', "game.js")
    forbid(game, 'name: "Snowball"', "game.js")
    forbid(game, 'name: "Ice Brace"', "game.js")
    forbid(game, 'name: "Bark Buckler"', "game.js")
    must(game, 'name: "Sap Snare"', "game.js")
    must(game, 'name: "Stun Cone"', "game.js")
    must(game, 'name: "Grav Lure"', "game.js")
    must(game, 'name: "Dynamite", dmg: 58, blast: 58', "game.js")
    must(game, 'name: "Sap Bomb", dmg: 40, blast: 52', "game.js")
    must(game, 'name: "Lodge Mortar", dmg: 50, blast: 54', "game.js")
    must(game, 'name: "Pinecone Cluster", dmg: 16, blast: 28', "game.js")
    must(game, 'name: "Woodchip Mine", dmg: 52, blast: 42', "game.js")
    must(game, "function plantSnare(", "game.js")
    must(game, "function gravPull(", "game.js")
    must(game, "function scanFairX(", "game.js")
    must(game, "function stampPad(", "game.js")
    must(game, "function sampleBank(", "game.js")
    must(game, 'name: "Corkscrew Rocket", dmg: 55, blast: 46', "game.js")
    must(game, 'name: "Lodge Chaingun", dmg: 14, blast: 12', "game.js")
    must(game, "const ROCKET_COST = 50", "game.js")
    must(game, "const CHAIN_COST = 48", "game.js")
    must(game, "function spawnChainRound(", "game.js")
    must(game, "gunBurst", "game.js")
    must(game, "corkscrew-rocket.png", "game.js")
    must(game, "lodge-chaingun.png", "game.js")
    must(game, "const FUSE_SEC = 2", "game.js")
    must(game, "const SAP_TICKS = 2", "game.js")
    must(game, "const CRATE_EVERY = 3", "game.js")
    must(game, "const DYN_COST = 35", "game.js")
    must(game, "const SAP_COST = 30", "game.js")
    must(game, "const MORTAR_COST = 45", "game.js")
    must(game, "const SNARE_COST = 30", "game.js")
    must(game, "const STUN_COST = 38", "game.js")
    must(game, "const LURE_COST = 45", "game.js")
    must(game, "const PINE_COST = 40", "game.js")
    must(game, "const MINE_COST = 32", "game.js")
    must(game, "function inSnare(", "game.js")
    must(game, "const START_COINS = 180", "game.js")
    must(game, 'id: "ledges"', "game.js")
    must(game, 'id: "mesa"', "game.js")
    must(game, 'id: "crater"', "game.js")
    must(game, 'id: "methane"', "game.js")
    must(game, 'id: "acid"', "game.js")
    must(game, 'id: "ring"', "game.js")
    must(game, 'id: "pack"', "game.js")
    must(game, 'id: "frost"', "game.js")
    must(game, 'id: "dock"', "game.js")
    forbid(game, "function placeIceWall(", "game.js")
    must_re(game, r"return \(Math\.random\(\) \* 9 \| 0\) - 4", "game.js")
    must(game, "lodge: [180, 280, 380]", "game.js")
    must(game, "lodge: [140, 230, 320]", "game.js")
    must(game, 'openShop("match")', "game.js")
    must(game, "function shopAllowed(", "game.js")
    must(game, "const SD_TURN = 16", "game.js")
    must(game, "const SD_RISE = 18", "game.js")
    must(game, "function fairPads(", "game.js")
    must(game, "function zapJump(", "game.js")
    must(game, "function fangSpark(", "game.js")
    must(game, "function emberHop(", "game.js")
    must(game, 'name: "Arc Zap"', "game.js")
    must(game, 'name: "Ricochet Fang"', "game.js")
    must(game, 'name: "Ember Cascade"', "game.js")
    must(game, "function tickSuddenDeath(", "game.js")
    must(game, "function drawStory(", "game.js")
    must(game, "function drawSdScreen(", "game.js")
    must(game, "function hurtBand(", "game.js")
    must(game, 'story: "Starfall over the Green Home bowl."', "game.js")
    must(game, 'story: "Jet duel over the ice bridge."', "game.js")
    must(game, 'story: "Mars colony. Dust takes the unsheltered."', "game.js")
    must(game, 'story: "Moon landing. Miss the rim and you void."', "game.js")
    must(game, 'story: "Ice quake on the methane shelf."', "game.js")
    must(game, 'story: "Venus vents. Not a flamethrower."', "game.js")
    must(game, 'story: "Ring debris. The span chips."', "game.js")
    must(game, 'story: "Deep current. The pack surges."', "game.js")
    must(game, 'story: "Heart frost. A probe blinks in the dark."', "game.js")
    must(game, 'story: "Asteroid mining. The notch sways."', "game.js")
    must(game, "bober-limp.png", "game.js")
    must(game, "bober-kneel.png", "game.js")
    must(read("js/audio.js"), "siren()", "js/audio.js")
    must(game, "function guessCpuAim(", "game.js")
    must(game, "function cpuShop(", "game.js")
    must(game, "function setDiff(", "game.js")
    must(game, "function packState(", "game.js")
    must(game, "function isLink(", "game.js")
    must(game, "function isGuest(", "game.js")
    read("js/net.js")
    must(read("js/net.js"), "peerjs", "js/net.js")
    must(read("js/net.js"), "byw-", "js/net.js")
    must(read("js/net.js"), "stun:stun.l.google.com:19302", "js/net.js")
    must(read("js/net.js"), "0.peerjs.com", "js/net.js")
    must(read("js/net.js"), "turn:eu-0.turn.peerjs.com", "js/net.js")
    must(read("js/net.js"), "ICE FAIL", "js/net.js")
    must(html, "ICE FAIL", "index.html")
    must(game, "easy:", "game.js")
    must(game, "normal:", "game.js")
    must(game, "hard:", "game.js")
    must(game, "function hazardY(", "game.js")
    must(game, "const LEDGES_PAD = 140", "game.js")
    must(game, "ledges-ground.png", "game.js")
    must(game, "bowl-ground.png", "game.js")
    must(game, "mesa-ground.png", "game.js")
    must(game, "crater-ground.png", "game.js")
    must(game, "methane-ground.png", "game.js")
    must(game, "acid-ground.png", "game.js")
    must(game, "ring-ground.png", "game.js")
    must(game, "pack-ground.png", "game.js")
    must(game, "frost-ground.png", "game.js")
    must(game, "dock-ground.png", "game.js")
    must(game, "function plantMine(", "game.js")
    must(game, "function splitPine(", "game.js")
    must(game, "MORE $BOBER", "game.js")
    must(html, 'id="btn-shop"', "index.html")
    must(html, 'id="btn-fire"', "index.html")
    must(html, ">SHOP<", "index.html")
    forbid(html, 'btn-shop-dock', "index.html")
    forbid(html, "shop-dock", "index.html")
    must(game, "function fillMound(", "game.js")
    must(game, "function drawIceBridge(", "game.js")
    must(game, "function paintMoundFallback(", "game.js")
    must(game, "carve(", "game.js")
    must(game, "b.airborne = false", "game.js")
    must(game, "flying ? img.fly : img.idle", "game.js")
    must(game, "function maybeEnd(", "game.js")
    must(game, "YOU WIN", "game.js")
    must(game, "YOU LOSE", "game.js")
    must(game, "function fightSpan(", "game.js")
    must(game, "function syncOrient(", "game.js")
    must(game, "function scrollTray(", "game.js")
    must(game, "function drawSkyCover(", "game.js")
    must(game, "Math.max(sW, sH)", "game.js")
    must(game, "skyFill: true", "game.js")
    forbid(game, '"btn-shop", "coin-chip"', "game.js")

    must(lore, "Lodge Bowl", "lore.js")
    must(lore, "Starfall over the banks", "lore.js")
    must(lore, "Jet duel over the ice bridge", "lore.js")
    must(lore, "Not a flamethrower", "lore.js")
    must(lore, "Twin Ledges", "lore.js")
    must(lore, "Red Mesa", "lore.js")
    must(lore, "Crater Rim", "lore.js")
    must(lore, "Methane Shelf", "lore.js")
    must(lore, "Acid Vents", "lore.js")
    must(lore, "Ring Span", "lore.js")
    must(lore, "Deep Pack", "lore.js")
    must(lore, "Frost Pit", "lore.js")
    must(lore, "Dock Notch", "lore.js")
    must(lore, "Yeet Stick", "lore.js")
    must(lore, "Lodge Mortar", "lore.js")
    forbid(lore, "Ice Brace", "lore.js")
    forbid(lore, "Bark Buckler", "lore.js")
    forbid(lore, "Snowball", "lore.js")
    must(lore, "Sap Snare", "lore.js")
    must(lore, "Stun Cone", "lore.js")
    must(lore, "Grav Lure", "lore.js")
    must(lore, "Pinecone Cluster", "lore.js")
    must(lore, "Woodchip Mine", "lore.js")
    must(lore, "Corkscrew Rocket", "lore.js")
    must(lore, "Corkscrew Rocket", "lore.js")
    must(lore, "Lodge Chaingun", "lore.js")
    must(lore, "Arc Zap", "lore.js")
    must(lore, "Ricochet Fang", "lore.js")
    must(lore, "Ember Cascade", "lore.js")
    must(lore, "Link Battle", "lore.js")
    must(lore, "room code", "lore.js")
    must(lore, "assets/history/twin-ledges.jpg", "lore.js")
    must(lore, "Green Home to deep space", "lore.js")
    must(readme, "Bober Yeet War", "README.md")
    must(readme, "Red Mesa", "README.md")
    must(readme, "Sudden Death", "README.md")
    must(readme, "Easy", "README.md")
    must(readme, "Link Battle", "README.md")
    must(readme, "Corkscrew Rocket", "README.md")
    must(readme, "Lodge Chaingun", "README.md")
    must(readme, "Arc Zap", "README.md")
    must(readme, "Ricochet Fang", "README.md")
    must(readme, "Ember Cascade", "README.md")
    must(readme, "Sap Snare", "README.md")
    must(readme, "Stun Cone", "README.md")
    must(readme, "Grav Lure", "README.md")
    forbid(readme, "Snowball", "README.md")
    must(readme, "own scrap", "README.md")
    must(html, "js/net.js", "index.html")

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

    cards = html.count('class="map-card')
    if cards < 20:
        FAILS.append("need 10 map cards on splash and end (got %d)" % cards)

    for rel in (
        "assets/sprites/yeet-stick.png",
        "assets/sprites/snowball.png",
        "assets/sprites/dynamite.png",
        "assets/sprites/sap-bomb.png",
        "assets/sprites/mortar.png",
        "assets/sprites/ice-brace.png",
        "assets/sprites/pinecone.png",
        "assets/sprites/woodchip-mine.png",
        "assets/sprites/bark-buckler.png",
        "assets/sprites/corkscrew-rocket.png",
        "assets/sprites/lodge-chaingun.png",
        "assets/sprites/arc-zap.png",
        "assets/sprites/sap-snare.png",
        "assets/sprites/stun-cone.png",
        "assets/sprites/grav-lure.png",
        "assets/sprites/ricochet-fang.png",
        "assets/sprites/ember-cascade.png",
        "assets/sprites/crate.png",
        "assets/sprites/splash-hero.png",
        "assets/sprites/bober-idle.png",
        "assets/sprites/bober-limp.png",
        "assets/sprites/bober-kneel.png",
        "assets/sprites/story-jet.png",
        "assets/sprites/story-lander.png",
        "assets/sprites/story-probe.png",
        "assets/sprites/story-drone.png",
        "assets/sprites/story-torch.png",
        "assets/history/bank-fight.jpg",
        "assets/history/aim-wind.jpg",
        "assets/history/crate-gear.jpg",
        "assets/history/twin-ledges.jpg",
        "assets/history/lodge-bowl.jpg",
        "assets/history/red-mesa.jpg",
        "assets/history/crater-rim.jpg",
        "assets/history/methane-shelf.jpg",
        "assets/history/acid-vents.jpg",
        "assets/history/ring-span.jpg",
        "assets/history/deep-pack.jpg",
        "assets/history/frost-pit.jpg",
        "assets/history/dock-notch.jpg",
        "assets/sprites/ledges-ground.png",
        "assets/sprites/bowl-ground.png",
        "assets/sprites/mesa-ground.png",
        "assets/sprites/crater-ground.png",
        "assets/sprites/methane-ground.png",
        "assets/sprites/acid-ground.png",
        "assets/sprites/ring-ground.png",
        "assets/sprites/pack-ground.png",
        "assets/sprites/frost-ground.png",
        "assets/sprites/dock-ground.png",
        "assets/sprites/stage-sky.jpg",
        "assets/sprites/sky-mars.jpg",
        "assets/sprites/sky-moon.jpg",
        "assets/sprites/sky-uranus.jpg",
        "assets/sprites/sky-venus.jpg",
        "assets/sprites/sky-saturn.jpg",
        "assets/sprites/sky-neptune.jpg",
        "assets/sprites/sky-pluto.jpg",
        "assets/sprites/sky-asteroid.jpg",
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

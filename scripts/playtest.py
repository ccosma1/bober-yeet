"""Headless playtest: idle freeze, aim UX, Dynamite/Sap, $BOBER, history stills."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=war12"


def shot(page, name):
    p = OUT / name
    page.screenshot(path=str(p), animations="disabled")
    print("shot", name)


def wait_phase(page, want, timeout=12000):
    page.wait_for_function(
        """(want) => {
          const w = window.__yeetWar;
          if (!w) return false;
          const p = w.snapshot().phase;
          if (Array.isArray(want)) return want.includes(p);
          return p === want;
        }""",
        arg=want,
        timeout=timeout,
    )


def snap(page):
    return page.evaluate("() => window.__yeetWar.snapshot()")


def is_flat_purple(rgba):
    r, g, b = rgba[0], rgba[1], rgba[2]
    fills = ((58, 42, 106), (44, 27, 88), (36, 20, 60), (26, 16, 53))
    return any(abs(r - fr) <= 10 and abs(g - fg) <= 10 and abs(b - fb) <= 12 for fr, fg, fb in fills)


def canvas_edges(page):
    return page.evaluate(
        """() => {
          const c = document.getElementById('game');
          const ctx = c.getContext('2d');
          const w = c.width, h = c.height;
          const samp = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data);
          const midX = (w / 2) | 0;
          const midY = (h / 2) | 0;
          return {
            w, h,
            top: samp(midX, 8),
            bot: samp(midX, Math.max(0, h - 10)),
            left: samp(8, midY),
            right: samp(Math.max(0, w - 10), midY),
          };
        }"""
    )


def visible_shop_ids(page):
    return page.evaluate(
        """() => [...document.querySelectorAll('button')].filter((b) => {
          const t = (b.innerText || '').trim();
          if (t !== 'SHOP') return false;
          const r = b.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }).map((b) => b.id)"""
    )


def assert_one_top_shop(page, vp_h):
    assert page.locator("#btn-shop-dock").count() == 0
    ids = visible_shop_ids(page)
    print("SHOP IDS", ids)
    assert ids == ["btn-shop"]
    shop = page.locator("#btn-shop").bounding_box()
    coin = page.locator("#coin-chip").bounding_box()
    assert shop and shop["y"] < min(90, vp_h * 0.24)
    assert coin and abs(shop["y"] - coin["y"]) < 56
    title = page.locator("#coin-chip").get_attribute("title") or ""
    assert "shop" not in title.lower()
    page.click("#coin-chip")
    page.wait_for_timeout(120)
    assert "hidden" in (page.locator("#shop").get_attribute("class") or "")


def assert_fat_fire_br(page, vp_w, vp_h):
    fire = page.locator("#btn-fire").bounding_box()
    print("FIRE", fire)
    assert fire and fire["height"] >= 44
    assert fire["x"] + fire["width"] > vp_w * 0.62
    assert fire["y"] + fire["height"] > vp_h * 0.72
    assert fire["y"] >= -1
    assert fire["y"] + fire["height"] <= vp_h + 1


def open_weapons(page):
    pop = page.locator("#wep-pop")
    cls = pop.get_attribute("class") or ""
    if "hidden" in cls:
        page.click("#btn-weapons")
        page.wait_for_timeout(80)
    assert "hidden" not in (pop.get_attribute("class") or "")


def close_weapons(page):
    pop = page.locator("#wep-pop")
    cls = pop.get_attribute("class") or ""
    if "hidden" not in cls:
        page.click("#wep-pop-close")
        page.wait_for_timeout(80)
    assert "hidden" in (pop.get_attribute("class") or "")


def assert_chrome_fits(page, vp_w, vp_h, landscape=False):
    dock = page.locator("#dock").bounding_box()
    print("DOCK", dock)
    assert dock
    assert dock["y"] >= -1
    assert dock["y"] + dock["height"] <= vp_h + 1
    if landscape:
        assert dock["height"] / vp_h <= 0.28 + 0.02
    else:
        assert dock["height"] / vp_h <= 0.36
    fire = page.locator("#btn-fire").bounding_box()
    wep = page.locator("#btn-weapons").bounding_box()
    sel = page.locator("#wep-sel").bounding_box()
    print("COMPACT", fire, wep, sel)
    assert fire and wep and sel
    assert wep["y"] >= dock["y"] - 2
    assert sel["y"] >= dock["y"] - 2
    assert fire["y"] >= -1
    assert fire["y"] + fire["height"] <= vp_h + 1
    assert fire["y"] + fire["height"] <= dock["y"] + dock["height"] + 2
    assert page.locator("#tray-l").count() == 0
    assert page.locator("#tray-r").count() == 0
    ids = ["w-stick", "w-dynamite", "w-sap", "w-mortar", "w-pine", "w-mine", "w-rocket", "w-chain", "w-zap", "w-fang", "w-ember", "w-snare", "w-stun", "w-lure"]
    open_weapons(page)
    for wid in ids:
        loc = page.locator("#" + wid)
        loc.scroll_into_view_if_needed()
        page.wait_for_timeout(20)
        box = loc.bounding_box()
        print("WEP", wid, box)
        assert box and box["height"] >= 32
        assert box["y"] >= -2
        assert box["y"] + box["height"] <= vp_h + 2
    close_weapons(page)


def both_teams_visible(s):
    v = s.get("view") or {}
    cam_x = v.get("camX", 0)
    scale = v.get("s") or 1
    css_w = v.get("cssW") or 1
    lodge = creek = False
    for b in s["bobers"]:
        if not b["alive"]:
            continue
        x = (b["x"] - cam_x) * scale
        on = -30 <= x <= css_w + 30
        if b["team"] == "lodge" and on:
            lodge = True
        if b["team"] == "creek" and on:
            creek = True
    return lodge, creek, v


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(500)

        title = page.locator("h1").inner_text()
        tag = page.locator(".tagline").inner_text()
        mission = page.locator(".mission").inner_text()
        print("TITLE", repr(title))
        print("TAG", repr(tag))
        print("MISSION", repr(mission))
        assert title == "BOBER YEET WAR"
        assert tag == "Fan game by a holder."
        assert mission == "Aim, power, wind. Dig cover. Last beaver standing."
        body = page.inner_text("body")
        low = body.lower()
        assert "worms" not in low
        assert "team17" not in low
        assert page.locator("#btn-play").inner_text() == "START"
        assert page.locator("#btn-howto").inner_text() == "HOW TO PLAY"
        assert page.locator("#splash-maps .map-card").count() == 10
        story = page.locator("#map-story").inner_text()
        print("STORY", story)
        assert "Starfall" in story
        page.click('#splash-maps .map-card[data-map="crater"]')
        page.wait_for_timeout(80)
        assert "Moon landing" in page.locator("#map-story").inner_text()
        page.click('#splash-maps .map-card[data-map="ledges"]')
        assert page.locator("#splash-diff .diff-card").count() == 3
        assert page.locator("#splash-diff .diff-card.on").inner_text() == "NORMAL"
        assert page.locator("#mode-vsai").inner_text() == "VS AI"
        assert page.locator("#mode-link").inner_text() == "LINK BATTLE"
        page.click("#mode-link")
        page.wait_for_timeout(120)
        assert "hidden" not in (page.locator("#link-panel").get_attribute("class") or "")
        assert page.locator("#btn-host").inner_text() == "HOST"
        assert page.locator("#btn-join").inner_text() == "JOIN"
        page.click("#btn-join")
        page.wait_for_timeout(80)
        assert "hidden" not in (page.locator("#join-box").get_attribute("class") or "")
        page.click("#btn-join-cancel")
        page.click("#mode-vsai")
        page.wait_for_timeout(80)
        assert "hidden" in (page.locator("#link-panel").get_attribute("class") or "")
        shot(page, "test-splash.png")
        splash_maps = page.locator("#splash-maps").inner_text()
        for name in (
            "Lodge Bowl",
            "Twin Ledges",
            "Red Mesa",
            "Crater Rim",
            "Methane Shelf",
            "Acid Vents",
            "Ring Span",
            "Deep Pack",
            "Frost Pit",
            "Dock Notch",
        ):
            assert name in splash_maps
        page.click("#btn-howto")
        page.wait_for_timeout(200)
        how = page.locator("#howto").inner_text()
        print("HOWTO", how[:220])
        assert "HP" in how
        assert "out" in how.lower()
        assert "crate" in how.lower()
        assert "WEAPONS" in how
        assert "tilt" not in how.lower()
        assert "Pinecone" in how
        assert "Corkscrew Rocket" in how
        assert "Lodge Chaingun" in how
        assert "Arc Zap" in how
        assert "Ricochet Fang" in how
        assert "Ember Cascade" in how
        assert "turn 16" in how
        assert "turn 14" in how
        assert "80" in how
        assert "Walk left" in how
        assert "same Wi-Fi not required" in how
        assert "Red Mesa" in how
        assert "Sudden Death" in how
        assert "own scrap" in how
        assert "Easy" in how and "Hard" in how
        assert "Link Battle" in how
        assert "PeerJS" in how
        assert "hotseat" not in how.lower()
        shot(page, "test-howto.png")
        page.click("#howto-close")

        page.click("#btn-history")
        page.wait_for_timeout(250)
        assert page.locator("#history .museum-card").count() >= 10
        page.locator("#history .museum-card").nth(0).click()
        page.wait_for_timeout(200)
        det = page.locator("#history-detail").inner_text()
        print("HIST", det[:160])
        assert "bowl" in det.lower() or "green home" in det.lower()
        shot(page, "test-history.png")
        page.click("#history-close")

        page.click("#btn-museum")
        page.wait_for_timeout(200)
        assert page.locator("#museum .museum-card").count() >= 22
        shot(page, "test-museum.png")
        page.click("#museum-close")

        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        sd_rows = page.evaluate(
            """() => {
              const w = window.__yeetWar;
              return Object.keys(w.MAPS).map((id) => {
                w.setMap(id);
                return Object.assign({ id: id }, w.mapSd());
              });
            }"""
        )
        print("SD MAPS", sd_rows)
        by_sd = {r["id"]: r for r in sd_rows}
        for row in sd_rows:
            assert row["turn"] >= 14, row
            assert row["late"] > row["turn"], row
        assert by_sd["bowl"]["rise"] < by_sd["ledges"]["rise"]
        assert by_sd["methane"]["rise"] < by_sd["mesa"]["rise"]
        assert by_sd["bowl"]["turn"] > by_sd["mesa"]["turn"]
        page.evaluate("() => window.__yeetWar.setMap('ledges')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        page.wait_for_timeout(400)
        s = snap(page)
        print("IDLE", [(b["name"], b["vx"], b["standing"], b["airborne"]) for b in s["bobers"]])
        print("MAP", s.get("mapId"))
        assert s["phase"] == "aim"
        assert s["mapId"] == "ledges"
        assert "Jet duel" in (s.get("story") or "")
        page.evaluate("() => window.__yeetWar.setHp(0, 20)")
        assert snap(page)["bobers"][0]["hurt"] == "low"
        page.evaluate("() => window.__yeetWar.setHp(0, 8)")
        assert snap(page)["bobers"][0]["hurt"] == "kneel"
        page.evaluate("() => window.__yeetWar.setHp(0, 80)")
        assert snap(page)["bobers"][0]["hurt"] == "high"
        page.evaluate("() => window.__yeetWar.forceSudden()")
        s = snap(page)
        print("SD STORY", s.get("sudden"), s.get("sdFlash"), s.get("sdRise"))
        assert s["sudden"] is True
        assert s["sdRise"] >= 18
        assert (s.get("sdFlash") or 0) > 0
        shot(page, "test-sudden-world.png")
        page.evaluate("() => window.__yeetWar.startMatch()")
        wait_phase(page, "aim", timeout=8000)
        s = snap(page)
        assert s["sudden"] is False
        assert s["coins"] >= 180
        assert s["cpuCoins"] == s["coins"]
        assert len(s["bobers"]) == 6
        for b in s["bobers"]:
            if not b["alive"]:
                continue
            assert abs(b["vx"]) < 0.05
            assert abs(b["vy"]) < 0.05
            assert b["standing"] is True
            assert b["airborne"] is False
        tip = page.locator("#tip-strip")
        assert "hidden" not in (tip.get_attribute("class") or "")
        assert "angle" in tip.inner_text().lower()
        assert page.locator("#coin-chip").inner_text().startswith("$BOBER")
        assert page.locator("#walk-chip").inner_text().startswith("Walk left")
        walk0 = snap(page)["bobers"][0]
        page.evaluate("() => window.__yeetWar.walk(-1)")
        page.wait_for_timeout(450)
        walk1 = snap(page)["bobers"][0]
        print("WALK STEP", walk0["x"], walk1["x"], walk1.get("walkLeft"))
        assert walk1["x"] < walk0["x"]
        assert walk0["x"] - walk1["x"] < 80
        assert walk1["walkLeft"] < page.evaluate("() => window.__yeetWar.WALK_MAX")
        assert page.evaluate("() => window.__yeetWar.HP_MAX") == 80
        for b in s["bobers"]:
            if b["alive"]:
                assert b["hp"] == 80
                assert b["y"] > 300
        shot(page, "test-match.png")
        assert page.locator("#btn-shop").inner_text() == "SHOP"
        assert_one_top_shop(page, 720)
        assert_fat_fire_br(page, 1280, 720)
        assert_chrome_fits(page, 1280, 720, landscape=True)
        page.click("#btn-shop")
        page.wait_for_timeout(200)
        assert "hidden" not in (page.locator("#shop").get_attribute("class") or "")
        assert "BACK TO FIGHT" in page.locator("#shop-play").inner_text()
        page.evaluate("() => window.__yeetWar.setCoins(200)")
        page.click("#buy-mortar")
        page.wait_for_timeout(80)
        s = snap(page)
        assert s["ammo"]["lodge"]["mortar"] >= 1
        assert s["phase"] == "aim"
        shot(page, "test-midshop.png")
        page.click("#shop-play")
        wait_phase(page, "aim", timeout=5000)
        s = snap(page)
        assert s["phase"] == "aim"
        assert s["ammo"]["lodge"]["mortar"] >= 1
        page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('mortar'); w.setAim(-42, 62); w.fire(); }")
        page.wait_for_timeout(420)
        shot(page, "test-mortar.png")
        page.wait_for_function(
            "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'mortar'",
            timeout=8000,
        )
        s = snap(page)
        print("MIDSHOP MORTAR", s["lastBlast"], "ammo", s["ammo"]["lodge"])
        assert s["lastBlast"]["dmg"] == 75
        wait_phase(page, ["aim", "cpu", "end"], timeout=15000)
        if snap(page)["phase"] == "cpu":
            wait_phase(page, ["aim", "end"], timeout=20000)

        if snap(page)["phase"] == "aim":
            page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('stick'); w.setAim(22, 42); w.fire(); }")
            page.wait_for_function(
                "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'stick'",
                timeout=8000,
            )
            s = snap(page)
            print("STICK", s["lastBlast"])
            shot(page, "test-crater.png")
        wait_phase(page, ["aim", "cpu", "end"], timeout=15000)
        if snap(page)["phase"] == "cpu":
            wait_phase(page, ["aim", "end"], timeout=20000)

        if snap(page)["phase"] == "aim":
            page.evaluate(
                """() => {
                  const w = window.__yeetWar;
                  w.giveAmmo('lodge', 'dynamite', 2);
                  w.setWeapon('dynamite');
                  w.setAim(20, 40);
                  w.fire();
                }"""
            )
            page.wait_for_function(
                "() => window.__yeetWar.snapshot().fuses.length > 0 || (window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'dynamite')",
                timeout=8000,
            )
            s = snap(page)
            print("FUSE", s["fuses"], s["phase"])
            shot(page, "test-dynamite.png")
            page.wait_for_function(
                "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'dynamite'",
                timeout=8000,
            )
            s = snap(page)
            print("DYN BLAST", s["lastBlast"])
            assert s["lastBlast"]["r"] == 87
            assert s["lastBlast"]["dmg"] == 87
            wait_phase(page, ["aim", "cpu", "end"], timeout=15000)
            if snap(page)["phase"] == "cpu":
                wait_phase(page, ["aim", "end"], timeout=20000)

        if snap(page)["phase"] == "aim":
            page.evaluate(
                """() => {
                  const w = window.__yeetWar;
                  w.giveAmmo('lodge', 'sap', 1);
                  w.setWeapon('sap');
                  w.setAim(18, 38);
                  w.fire();
                }"""
            )
            page.wait_for_function(
                "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'sap'",
                timeout=8000,
            )
            s = snap(page)
            print("SAP", s["lastBlast"])
            assert s["lastBlast"]["r"] == 78
            shot(page, "test-sap.png")
            wait_phase(page, ["aim", "cpu", "end"], timeout=15000)

        page.evaluate("() => window.__yeetWar.spawnCrate('coin', 80)")
        page.wait_for_timeout(80)
        s = snap(page)
        print("CRATE", s["crates"])
        assert any(c["kind"] == "coin" for c in s["crates"])
        shot(page, "test-crate.png")

        page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('stick'); w.setAim(-52, 72); w.fire(); }")
        page.wait_for_timeout(600)
        page.evaluate("() => window.__yeetWar.killTeam('creek')")
        wait_phase(page, "end", timeout=8000)
        win_title = page.locator("#end-title").inner_text()
        print("WIN", win_title)
        assert "YOU WIN" in win_title
        assert page.locator("#end-restart").inner_text() == "REMATCH"
        assert page.locator("#end-splash").inner_text() == "SPLASH"
        shot(page, "test-win.png")

        page.click("#end-restart")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate("() => window.__yeetWar.killTeam('lodge')")
        wait_phase(page, "end", timeout=8000)
        lose_title = page.locator("#end-title").inner_text()
        print("LOSE", lose_title)
        assert "YOU LOSE" in lose_title
        shot(page, "test-lose.png")

        page.click("#end-splash")
        page.wait_for_timeout(200)
        page.click("#btn-gear")
        page.wait_for_timeout(200)
        shop = page.locator("#shop").inner_text()
        print("SHOP", shop[:240])
        assert "35 $BOBER" in shop
        assert "45 $BOBER" in shop
        assert "38 $BOBER" in shop
        assert "40 $BOBER" in shop
        assert "32 $BOBER" in shop
        assert "30 $BOBER" in shop
        assert "50 $BOBER" in shop
        assert "48 $BOBER" in shop
        assert "Corkscrew Rocket" in shop
        assert "Lodge Chaingun" in shop
        assert "Arc Zap" in shop
        assert "Ricochet Fang" in shop
        assert "Ember Cascade" in shop
        assert "Sap Snare" in shop
        assert "Stun Cone" in shop
        assert "Grav Lure" in shop
        assert "Snowball" not in shop
        assert "Ice Brace" not in shop
        assert "Bark Buckler" not in shop
        assert "55 $BOBER" in shop
        assert "42 $BOBER" in shop
        assert "60 $BOBER" in shop
        assert "cannot buy a win" in shop.lower()
        shot(page, "test-shop.png")
        page.evaluate("() => window.__yeetWar.setCoins(10)")
        page.wait_for_timeout(80)
        need = page.locator("#buy-mortar").inner_text()
        print("NEED BTN", need)
        assert "NEED" in need and "MORE $BOBER" in need
        page.evaluate("() => window.__yeetWar.setCoins(800)")
        page.wait_for_timeout(80)
        page.click("#buy-mortar")
        page.click("#buy-pine")
        page.click("#buy-mine")
        page.click("#buy-rocket")
        page.click("#buy-chain")
        page.click("#buy-zap")
        page.click("#buy-fang")
        page.click("#buy-ember")
        page.click("#buy-snare")
        page.click("#buy-stun")
        page.click("#buy-lure")
        s = snap(page)
        print("BUY", s["coins"], s["ammo"])
        assert s["ammo"]["lodge"]["mortar"] >= 1
        assert s["ammo"]["lodge"]["pine"] >= 1
        assert s["ammo"]["lodge"]["mine"] >= 1
        assert s["ammo"]["lodge"]["rocket"] >= 1
        assert s["ammo"]["lodge"]["chain"] >= 1
        assert s["ammo"]["lodge"]["zap"] >= 1
        assert s["ammo"]["lodge"]["fang"] >= 1
        assert s["ammo"]["lodge"]["ember"] >= 1
        assert s["ammo"]["lodge"]["snare"] >= 1
        assert s["ammo"]["lodge"]["stun"] >= 1
        assert s["ammo"]["lodge"]["lure"] >= 1
        page.click("#shop-play")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate(
            """() => {
              const w = window.__yeetWar;
              w.giveAmmo('lodge', 'snare', 1);
              w.setWeapon('snare');
              w.setAim(90, 28);
              w.fire();
            }"""
        )
        page.wait_for_function("() => (window.__yeetWar.snapshot().snares || []).length > 0 || (window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'snare')", timeout=8000)
        s = snap(page)
        print("SNARE", s.get("snares"), s.get("lastBlast"))
        assert s["lastBlast"]["weapon"] == "snare"
        assert s["lastBlast"]["dmg"] == 12
        shot(page, "test-snare.png")
        diffs = page.evaluate("() => window.__yeetWar.DIFFS")
        assert diffs["easy"]["ang"] > diffs["hard"]["ang"] * 4
        assert diffs["easy"]["mortar"] < diffs["normal"]["mortar"] < diffs["hard"]["mortar"]
        page.evaluate("() => window.__yeetWar.setDiff('easy')")
        assert snap(page)["diff"] == "easy"
        page.evaluate("() => window.__yeetWar.setDiff('hard')")
        assert snap(page)["diff"] == "hard"
        hy0 = page.evaluate("() => window.__yeetWar.hazardY()")
        page.evaluate("() => window.__yeetWar.forceSudden()")
        s = snap(page)
        print("SUDDEN", s["sudden"], s["sdRise"], "hy", hy0, page.evaluate("() => window.__yeetWar.hazardY()"))
        assert s["sudden"] is True
        assert s["sdRise"] >= 18
        assert "hidden" not in (page.locator("#sd-chip").get_attribute("class") or "")
        assert "SUDDEN DEATH" in page.locator("#sd-chip").inner_text()
        assert page.evaluate("() => window.__yeetWar.hazardY()") < hy0
        shot(page, "test-sudden.png")
        page.evaluate("() => window.__yeetWar.startMatch()")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate("() => window.__yeetWar.spawnCrate('mortar', 80)")
        page.wait_for_timeout(80)
        assert any(c["kind"] == "mortar" for c in snap(page)["crates"])
        page.evaluate("() => window.__yeetWar.spawnCrate('rocket', 420)")
        page.evaluate("() => window.__yeetWar.spawnCrate('chain', 860)")
        page.evaluate("() => window.__yeetWar.spawnCrate('zap', 500)")
        page.wait_for_timeout(80)
        kinds = [c["kind"] for c in snap(page)["crates"]]
        assert "rocket" in kinds and "chain" in kinds and "zap" in kinds

        page.evaluate("() => window.__yeetWar.startMatch()")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate(
            """() => {
              const w = window.__yeetWar;
              w.giveAmmo('lodge', 'rocket', 1);
              w.setWeapon('rocket');
              w.setAim(90, 28);
              w.fire();
            }"""
        )
        page.wait_for_function(
            "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'rocket'",
            timeout=8000,
        )
        s = snap(page)
        print("ROCKET", s["lastBlast"])
        assert s["lastBlast"]["dmg"] == 83
        assert s["lastBlast"]["r"] == 69
        shot(page, "test-rocket.png")
        wait_phase(page, ["aim", "cpu", "end"], timeout=15000)
        if snap(page)["phase"] == "cpu":
            wait_phase(page, ["aim", "end"], timeout=20000)

        if snap(page)["phase"] == "aim":
            page.evaluate(
                """() => {
                  const w = window.__yeetWar;
                  w.giveAmmo('lodge', 'chain', 1);
                  w.setWeapon('chain');
                  w.setAim(85, 32);
                  w.fire();
                }"""
            )
            page.wait_for_function(
                "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'chain'",
                timeout=8000,
            )
            s = snap(page)
            print("CHAIN", s["lastBlast"])
            assert s["lastBlast"]["dmg"] == 21
            assert s["lastBlast"]["r"] == 18
            shot(page, "test-chain.png")
            wait_phase(page, ["aim", "cpu", "end"], timeout=15000)

        if snap(page)["phase"] == "cpu":
            wait_phase(page, ["aim", "end"], timeout=20000)
        if snap(page)["phase"] == "aim":
            page.evaluate(
                """() => {
                  const w = window.__yeetWar;
                  w.giveAmmo('lodge', 'zap', 1);
                  w.setWeapon('zap');
                  w.setAim(90, 28);
                  w.fire();
                }"""
            )
            page.wait_for_function(
                "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'zap'",
                timeout=8000,
            )
            s = snap(page)
            print("ZAP", s["lastBlast"])
            assert s["lastBlast"]["dmg"] == 42
            shot(page, "test-zap.png")
            wait_phase(page, ["aim", "cpu", "end"], timeout=15000)

        page.evaluate("() => window.__yeetWar.startMatch()")
        wait_phase(page, "aim", timeout=8000)
        cap = page.evaluate(
            """async () => {
              const w = window.__yeetWar;
              const b0 = w.snapshot().bobers.find((b) => b.team === 'lodge' && b.alive);
              w.setWalkLeft(b0.id, 36);
              const x0 = b0.x;
              for (let i = 0; i < 30; i++) {
                w.walk(-1);
                await new Promise((r) => setTimeout(r, 40));
              }
              await new Promise((r) => setTimeout(r, 400));
              const b = w.snapshot().bobers.find((x) => x.id === b0.id);
              return { dx: x0 - b.x, left: b.walkLeft, alive: b.alive, max: w.WALK_MAX };
            }"""
        )
        print("WALK CAP", cap)
        assert cap["max"] >= 230 and cap["max"] <= 320
        assert cap["alive"] is True
        assert cap["dx"] <= 44
        assert cap["dx"] >= 20
        assert cap["left"] <= 2

        for mid, fname in (
            ("bowl", "test-map-bowl.png"),
            ("mesa", "test-map-mesa.png"),
            ("crater", "test-map-crater.png"),
            ("methane", "test-map-methane.png"),
            ("acid", "test-map-acid.png"),
            ("ring", "test-map-ring.png"),
            ("pack", "test-map-pack.png"),
            ("frost", "test-map-frost.png"),
            ("dock", "test-map-dock.png"),
        ):
            page.evaluate("(id) => window.__yeetWar.setMap(id)", mid)
            page.evaluate("() => window.__yeetWar.startMatch()")
            wait_phase(page, "aim", timeout=8000)
            page.wait_for_timeout(250)
            s = snap(page)
            print("MAPSHOT", mid, s.get("mapId"), [(b["name"], int(b["y"])) for b in s["bobers"] if b["alive"]])
            assert s["mapId"] == mid
            assert len([b for b in s["bobers"] if b["alive"]]) == 6
            lodge_y = [b["y"] for b in s["bobers"] if b["alive"] and b["team"] == "lodge"]
            creek_y = [b["y"] for b in s["bobers"] if b["alive"] and b["team"] == "creek"]
            avg_l = sum(lodge_y) / len(lodge_y)
            avg_c = sum(creek_y) / len(creek_y)
            print("BANKS", mid, "lodge", int(avg_l), "creek", int(avg_c), "d", int(abs(avg_l - avg_c)))
            shot(page, fname)

        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.evaluate("() => window.__yeetWar.setMap('ledges')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        page.wait_for_timeout(400)
        app_cls = page.locator("#app").get_attribute("class") or ""
        print("PORTRAIT APP", app_cls)
        assert "portrait-block" not in app_cls
        assert page.locator("#tilt-play").count() == 0
        fire = page.locator("#btn-fire").bounding_box()
        stage = page.locator("#stage").bounding_box()
        vp_h = 844
        print("PHONE fire", fire, "stage", stage)
        assert fire and fire["height"] >= 44
        assert stage and stage["height"] / vp_h >= 0.55
        s = snap(page)
        lodge_on, creek_on, view = both_teams_visible(s)
        print("PHONE CAM", view, "lodge", lodge_on, "creek", creek_on)
        assert lodge_on and creek_on
        assert view.get("skyFill") is True
        edges = canvas_edges(page)
        print("PORTRAIT EDGES", edges)
        assert not is_flat_purple(edges["top"]), edges["top"]
        assert not is_flat_purple(edges["bot"]), edges["bot"]
        shot(page, "test-match-mobile.png")
        assert_one_top_shop(page, vp_h)
        assert_fat_fire_br(page, 390, vp_h)
        assert_chrome_fits(page, 390, vp_h, landscape=False)
        page.evaluate("() => window.__yeetWar.setMap('crater')")
        page.evaluate("() => window.__yeetWar.startMatch()")
        wait_phase(page, "aim", timeout=10000)
        page.wait_for_timeout(400)
        stage = page.locator("#stage").bounding_box()
        fire = page.locator("#btn-fire").bounding_box()
        print("CRATER PHONE", stage, fire)
        assert stage and stage["height"] / vp_h >= 0.55
        assert fire and fire["y"] >= -1 and fire["y"] + fire["height"] <= vp_h + 1
        assert_chrome_fits(page, 390, vp_h, landscape=False)
        open_weapons(page)
        page.locator("#w-chain").scroll_into_view_if_needed()
        assert page.locator("#w-chain").bounding_box()
        sel = page.evaluate(
            """() => {
              const stick = document.getElementById('w-stick');
              const game = document.getElementById('game');
              const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
              const blocked = !stick.dispatchEvent(ev);
              const canvasBlocked = !game.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
              const cs = getComputedStyle(stick);
              const cg = getComputedStyle(game);
              return {
                blocked,
                canvasBlocked,
                text: String(document.getSelection() && document.getSelection().toString() || ''),
                callout: cs.webkitTouchCallout,
                user: cs.webkitUserSelect || cs.userSelect,
                canvasTouch: cg.touchAction,
                canvasUser: cg.webkitUserSelect || cg.userSelect,
              };
            }"""
        )
        print("NOSELECT", sel)
        assert sel["blocked"] is True
        assert sel["canvasBlocked"] is True
        assert sel["text"] == ""
        assert sel["callout"] in ("none", "", None)
        assert "none" in (sel["user"] or "")
        assert sel["canvasTouch"] == "none"
        assert "none" in (sel["canvasUser"] or "")
        close_weapons(page)
        shot(page, "test-match-mobile-crater.png")
        page.click("#btn-shop")
        page.wait_for_timeout(250)
        assert "hidden" not in (page.locator("#shop").get_attribute("class") or "")
        page.evaluate("() => window.__yeetWar.setCoins(200)")
        page.click("#buy-mortar")
        page.wait_for_timeout(80)
        s = snap(page)
        print("PHONE BUY", s["ammo"]["lodge"], s["phase"])
        assert s["ammo"]["lodge"]["mortar"] >= 1
        assert s["phase"] == "aim"
        shot(page, "test-midshop-mobile.png")
        page.click("#shop-play")
        wait_phase(page, "aim", timeout=5000)
        page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('stick'); w.setAim(-50, 70); w.fire(); }")
        page.wait_for_timeout(800)
        page.evaluate("() => window.__yeetWar.killTeam('creek')")
        wait_phase(page, "end", timeout=8000)
        assert "YOU WIN" in page.locator("#end-title").inner_text()
        shot(page, "test-win-mobile.png")
        page.click("#end-restart")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate("() => window.__yeetWar.killTeam('lodge')")
        wait_phase(page, "end", timeout=8000)
        assert "YOU LOSE" in page.locator("#end-title").inner_text()

        def smoke_land(page, map_id, shot_name, check_purple=False):
            page.evaluate("(id) => window.__yeetWar.setMap(id)", map_id)
            page.evaluate("() => window.__yeetWar.startMatch()")
            wait_phase(page, "aim", timeout=10000)
            page.wait_for_timeout(500)
            assert page.locator("#tilt-play").count() == 0
            assert page.locator("#tray-l").count() == 0
            assert page.locator("#tray-r").count() == 0
            assert page.locator("#btn-weapons").count() == 1
            assert page.locator("#wep-pop").count() == 1
            stage = page.locator("#stage").bounding_box()
            print("LAND STAGE", map_id, stage)
            assert stage and stage["height"] / 390 >= 0.62
            s = snap(page)
            lodge_on, creek_on, view = both_teams_visible(s)
            print("LAND CAM", map_id, view, "lodge", lodge_on, "creek", creek_on)
            assert lodge_on and creek_on
            assert view.get("cover") is True
            assert view["s"] * 720 >= view["cssH"] - 2
            edges = canvas_edges(page)
            print("LAND EDGES", map_id, edges)
            if check_purple:
                assert not is_flat_purple(edges["top"]), edges["top"]
                assert not is_flat_purple(edges["bot"]), edges["bot"]
            assert_one_top_shop(page, 390)
            assert_fat_fire_br(page, 844, 390)
            assert_chrome_fits(page, 844, 390, landscape=True)
            page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('stick'); w.setAim(-48, 70); }")
            page.wait_for_timeout(180)
            shot(page, shot_name)
            page.click("#btn-shop")
            page.wait_for_timeout(200)
            assert "hidden" not in (page.locator("#shop").get_attribute("class") or "")
            page.evaluate("() => window.__yeetWar.setCoins(200)")
            page.click("#buy-mortar")
            assert snap(page)["ammo"]["lodge"]["mortar"] >= 1
            assert snap(page)["phase"] == "aim"
            page.click("#shop-play")
            wait_phase(page, "aim", timeout=5000)
            open_weapons(page)
            page.locator("#w-mortar").scroll_into_view_if_needed()
            page.click("#w-mortar")
            page.wait_for_timeout(80)
            assert "hidden" in (page.locator("#wep-pop").get_attribute("class") or "")
            page.wait_for_timeout(80)
            page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('mortar'); w.setAim(-42, 62); }")
            page.wait_for_timeout(200)
            page.evaluate("() => { const w = window.__yeetWar; w.fire(); }")
            page.wait_for_timeout(420)
            page.wait_for_function(
                "() => window.__yeetWar.lastBlast && window.__yeetWar.lastBlast.weapon === 'mortar'",
                timeout=8000,
            )
            s = snap(page)
            print("LAND MORTAR", map_id, s.get("lastBlast"), s.get("phase"))
            assert s["lastBlast"]["weapon"] == "mortar"
            assert s["lastBlast"]["dmg"] == 75

        page = browser.new_page(viewport={"width": 844, "height": 390}, is_mobile=True, has_touch=True)
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        smoke_land(page, "ledges", "test-match-mobile-landscape.png", check_purple=True)
        smoke_land(page, "mesa", "test-mobile-landscape.png", check_purple=True)
        page.evaluate("() => window.__yeetWar.killTeam('creek')")
        wait_phase(page, "end", timeout=8000)
        assert "YOU WIN" in page.locator("#end-title").inner_text()

        print("PLAYTEST_OK")
        browser.close()


if __name__ == "__main__":
    main()

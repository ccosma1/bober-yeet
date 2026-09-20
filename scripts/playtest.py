"""Headless playtest: idle freeze, aim UX, Dynamite/Sap, $BOBER, history stills."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=war7b"


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
    ids = ["w-stick", "w-snow", "w-dynamite", "w-sap", "w-mortar", "w-ice", "w-pine", "w-mine", "w-buckler", "w-rocket", "w-chain"]
    ys = []
    for wid in ids:
        loc = page.locator("#" + wid)
        loc.scroll_into_view_if_needed()
        page.wait_for_timeout(30)
        box = loc.bounding_box()
        print("WEP", wid, box)
        assert box and box["height"] >= 32
        assert box["y"] >= dock["y"] - 2
        assert box["y"] + box["height"] <= vp_h + 2
        assert box["y"] + box["height"] <= dock["y"] + dock["height"] + 2
        ys.append(box["y"])
    assert ys and max(ys) - min(ys) < 20, ys


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
        assert "chevron" in how.lower() or "◀" in how or "▶" in how
        assert "tilt" not in how.lower()
        assert "Pinecone" in how
        assert "Corkscrew Rocket" in how
        assert "Lodge Chaingun" in how
        assert "85" in how
        assert "Red Mesa" in how
        assert "Sudden Death" in how
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
        assert page.locator("#museum .museum-card").count() >= 20
        shot(page, "test-museum.png")
        page.click("#museum-close")

        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.evaluate("() => window.__yeetWar.setMap('ledges')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        page.wait_for_timeout(400)
        s = snap(page)
        print("IDLE", [(b["name"], b["vx"], b["standing"], b["airborne"]) for b in s["bobers"]])
        print("MAP", s.get("mapId"))
        assert s["phase"] == "aim"
        assert s["mapId"] == "ledges"
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
        assert page.evaluate("() => window.__yeetWar.HP_MAX") == 85
        for b in s["bobers"]:
            if b["alive"]:
                assert b["hp"] == 85
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
        assert s["lastBlast"]["dmg"] == 50
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
            assert s["lastBlast"]["r"] == 58
            assert s["lastBlast"]["dmg"] == 58
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
            assert s["lastBlast"]["r"] == 52
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
        assert "28 $BOBER" in shop
        assert "40 $BOBER" in shop
        assert "32 $BOBER" in shop
        assert "26 $BOBER" in shop
        assert "50 $BOBER" in shop
        assert "48 $BOBER" in shop
        assert "Corkscrew Rocket" in shop
        assert "Lodge Chaingun" in shop
        assert "cannot buy a win" in shop.lower()
        shot(page, "test-shop.png")
        page.evaluate("() => window.__yeetWar.setCoins(10)")
        page.wait_for_timeout(80)
        need = page.locator("#buy-mortar").inner_text()
        print("NEED BTN", need)
        assert "NEED" in need and "MORE $BOBER" in need
        page.evaluate("() => window.__yeetWar.setCoins(500)")
        page.wait_for_timeout(80)
        page.click("#buy-mortar")
        page.click("#buy-ice")
        page.click("#buy-pine")
        page.click("#buy-mine")
        page.click("#buy-buckler")
        page.click("#buy-rocket")
        page.click("#buy-chain")
        s = snap(page)
        print("BUY", s["coins"], s["ammo"])
        assert s["ammo"]["lodge"]["mortar"] >= 1
        assert s["ammo"]["lodge"]["ice"] >= 1
        assert s["ammo"]["lodge"]["pine"] >= 1
        assert s["ammo"]["lodge"]["mine"] >= 1
        assert s["ammo"]["lodge"]["buckler"] >= 1
        assert s["ammo"]["lodge"]["rocket"] >= 1
        assert s["ammo"]["lodge"]["chain"] >= 1
        page.click("#shop-play")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate(
            """() => {
              const w = window.__yeetWar;
              w.giveAmmo('lodge', 'ice', 1);
              w.setWeapon('ice');
              w.setAim(10, 40);
              w.fire();
            }"""
        )
        page.wait_for_function("() => window.__yeetWar.snapshot().walls.length > 0", timeout=8000)
        s = snap(page)
        print("ICE", s["walls"])
        assert s["walls"][0]["hp"] == 60
        shot(page, "test-ice.png")
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
        assert s["sdRise"] >= 32
        assert "hidden" not in (page.locator("#sd-chip").get_attribute("class") or "")
        assert "SUDDEN DEATH" in page.locator("#sd-chip").inner_text()
        assert page.evaluate("() => window.__yeetWar.hazardY()") < hy0
        shot(page, "test-sudden.png")
        page.evaluate("() => window.__yeetWar.startMatch()")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate("() => window.__yeetWar.spawnCrate('mortar', 80)")
        page.wait_for_timeout(80)
        assert any(c["kind"] == "mortar" for c in snap(page)["crates"])
        page.evaluate("() => window.__yeetWar.spawnCrate('rocket', 200)")
        page.evaluate("() => window.__yeetWar.spawnCrate('chain', 320)")
        page.wait_for_timeout(80)
        kinds = [c["kind"] for c in snap(page)["crates"]]
        assert "rocket" in kinds and "chain" in kinds

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
        assert s["lastBlast"]["dmg"] == 55
        assert s["lastBlast"]["r"] == 46
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
            assert s["lastBlast"]["dmg"] == 14
            assert s["lastBlast"]["r"] == 12
            shot(page, "test-chain.png")
            wait_phase(page, ["aim", "cpu", "end"], timeout=15000)

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
        page.evaluate("() => { const el = document.querySelector('.weapons'); if (el) el.scrollLeft = 0; }")
        page.click("#tray-r")
        page.wait_for_timeout(80)
        page.locator("#w-chain").scroll_into_view_if_needed()
        assert page.locator("#w-chain").bounding_box()
        sel = page.evaluate(
            """() => {
              const snow = document.getElementById('w-snow');
              const game = document.getElementById('game');
              const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
              const blocked = !snow.dispatchEvent(ev);
              const canvasBlocked = !game.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
              const cs = getComputedStyle(snow);
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
            assert page.locator("#tray-l").count() == 1
            assert page.locator("#tray-r").count() == 1
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
            page.evaluate("() => { const el = document.querySelector('.weapons'); if (el) el.scrollLeft = 0; }")
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
            page.click("#tray-r")
            page.wait_for_timeout(80)
            page.click("#tray-r")
            page.locator("#w-mortar").scroll_into_view_if_needed()
            page.click("#w-mortar")
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
            assert s["lastBlast"]["dmg"] == 50

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

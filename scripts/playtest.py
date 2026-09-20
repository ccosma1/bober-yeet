"""Headless playtest: idle freeze, aim UX, Dynamite/Sap, $BOBER, history stills."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=war3"


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
        assert page.locator("#splash-maps .map-card").count() == 5
        splash_maps = page.locator("#splash-maps").inner_text()
        assert "Lodge Bowl" in splash_maps
        assert "Twin Ledges" in splash_maps
        assert "Red Mesa" in splash_maps
        assert "Crater Rim" in splash_maps
        assert "Methane Shelf" in splash_maps
        shot(page, "test-splash.png")

        page.click("#btn-howto")
        page.wait_for_timeout(200)
        how = page.locator("#howto").inner_text()
        print("HOWTO", how[:220])
        assert "HP" in how
        assert "out" in how.lower()
        assert "crate" in how.lower()
        assert "landscape" in how.lower()
        assert "Red Mesa" in how
        shot(page, "test-howto.png")
        page.click("#howto-close")

        page.click("#btn-history")
        page.wait_for_timeout(250)
        assert page.locator("#history .museum-card").count() >= 5
        page.locator("#history .museum-card").nth(0).click()
        page.wait_for_timeout(200)
        det = page.locator("#history-detail").inner_text()
        print("HIST", det[:160])
        assert "bowl" in det.lower() or "green home" in det.lower()
        shot(page, "test-history.png")
        page.click("#history-close")

        page.click("#btn-museum")
        page.wait_for_timeout(200)
        assert page.locator("#museum .museum-card").count() >= 12
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
        for b in s["bobers"]:
            if b["alive"]:
                assert b["y"] > 300
        shot(page, "test-match.png")
        assert page.locator("#btn-shop").inner_text() == "SHOP"
        assert page.locator("#btn-shop-dock").inner_text() == "SHOP"
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
        assert s["lastBlast"]["dmg"] == 38
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
            assert s["lastBlast"]["r"] == 48
            assert s["lastBlast"]["dmg"] == 45
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
            assert s["lastBlast"]["r"] == 40
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
        assert "cannot buy a win" in shop.lower()
        shot(page, "test-shop.png")
        page.evaluate("() => window.__yeetWar.setCoins(200)")
        page.wait_for_timeout(80)
        page.click("#buy-mortar")
        page.click("#buy-ice")
        s = snap(page)
        print("BUY", s["coins"], s["ammo"])
        assert s["ammo"]["lodge"]["mortar"] >= 1
        assert s["ammo"]["lodge"]["ice"] >= 1
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
        page.evaluate("() => window.__yeetWar.spawnCrate('mortar', 80)")
        page.wait_for_timeout(80)
        assert any(c["kind"] == "mortar" for c in snap(page)["crates"])

        for mid, fname in (
            ("bowl", "test-map-bowl.png"),
            ("mesa", "test-map-mesa.png"),
            ("crater", "test-map-crater.png"),
            ("methane", "test-map-methane.png"),
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
        assert "portrait-block" in app_cls
        assert "hidden" not in (page.locator("#tilt-play").get_attribute("class") or "")
        shot(page, "test-tilt-mobile.png")
        page.click("#tilt-anyway")
        page.wait_for_timeout(200)
        assert "portrait-block" not in (page.locator("#app").get_attribute("class") or "")
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
        shot(page, "test-match-mobile.png")
        shop_box = page.locator("#btn-shop-dock").bounding_box()
        print("PHONE SHOP", shop_box)
        assert shop_box and shop_box["height"] >= 44
        page.click("#btn-shop-dock")
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

        page = browser.new_page(viewport={"width": 844, "height": 390})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.evaluate("() => window.__yeetWar.setMap('ledges')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        page.wait_for_timeout(400)
        assert "portrait-block" not in (page.locator("#app").get_attribute("class") or "")
        stage = page.locator("#stage").bounding_box()
        print("LAND STAGE", stage)
        assert stage and stage["height"] / 390 >= 0.55
        s = snap(page)
        lodge_on, creek_on, view = both_teams_visible(s)
        print("LAND CAM", view, "lodge", lodge_on, "creek", creek_on)
        assert lodge_on and creek_on
        shot(page, "test-match-mobile-landscape.png")
        shop_box = page.locator("#btn-shop-dock").bounding_box()
        assert shop_box and shop_box["height"] >= 36
        page.click("#btn-shop-dock")
        page.wait_for_timeout(200)
        assert "hidden" not in (page.locator("#shop").get_attribute("class") or "")
        page.evaluate("() => window.__yeetWar.setCoins(200)")
        page.click("#buy-ice")
        assert snap(page)["ammo"]["lodge"]["ice"] >= 1
        page.click("#shop-play")
        wait_phase(page, "aim", timeout=5000)
        page.evaluate("() => window.__yeetWar.killTeam('creek')")
        wait_phase(page, "end", timeout=8000)
        assert "YOU WIN" in page.locator("#end-title").inner_text()

        print("PLAYTEST_OK")
        browser.close()


if __name__ == "__main__":
    main()

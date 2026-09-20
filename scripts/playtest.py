"""Headless playtest: idle freeze, aim UX, Dynamite/Sap, $BOBER, history stills."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=war2"


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
        shot(page, "test-splash.png")

        page.click("#btn-howto")
        page.wait_for_timeout(200)
        how = page.locator("#howto").inner_text()
        print("HOWTO", how[:220])
        assert "HP" in how
        assert "out" in how.lower()
        assert "crate" in how.lower()
        shot(page, "test-howto.png")
        page.click("#howto-close")

        page.click("#btn-history")
        page.wait_for_timeout(250)
        assert page.locator("#history .museum-card").count() >= 4
        page.locator("#history .museum-card").nth(0).click()
        page.wait_for_timeout(200)
        det = page.locator("#history-detail").inner_text()
        print("HIST", det[:160])
        assert "yeet" in det.lower() or "sling" in det.lower()
        shot(page, "test-history.png")
        page.click("#history-close")

        page.click("#btn-museum")
        page.wait_for_timeout(200)
        assert page.locator("#museum .museum-card").count() >= 7
        shot(page, "test-museum.png")
        page.click("#museum-close")

        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        page.wait_for_timeout(400)
        s = snap(page)
        print("IDLE", [(b["name"], b["vx"], b["standing"], b["airborne"]) for b in s["bobers"]])
        assert s["phase"] == "aim"
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
        shot(page, "test-match.png")

        page.wait_for_timeout(900)
        s2 = snap(page)
        for a, b in zip(s["bobers"], s2["bobers"]):
            assert abs(a["x"] - b["x"]) < 2.5
            assert abs(a["y"] - b["y"]) < 3.5

        page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('stick'); w.setAim(22, 42); w.fire(); }")
        page.wait_for_function("() => window.__yeetWar.lastBlast", timeout=8000)
        s = snap(page)
        print("STICK", s["lastBlast"])
        assert s["lastBlast"]["weapon"] == "stick"
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

        page.evaluate("() => window.__yeetWar.killTeam('creek')")
        wait_phase(page, "end", timeout=8000)
        assert "BANK CLEARED" in page.locator("#end-title").inner_text()
        shot(page, "test-win.png")

        page.click("#end-restart")
        page.wait_for_timeout(250)
        shop = page.locator("#shop").inner_text()
        print("SHOP", shop[:200])
        assert "12 $BOBER" in shop
        assert "10 $BOBER" in shop
        assert "cannot buy a win" in shop.lower()
        shot(page, "test-shop.png")
        page.evaluate("() => window.__yeetWar.setCoins(40)")
        page.wait_for_timeout(100)
        page.click("#buy-dynamite")
        page.wait_for_timeout(150)
        s = snap(page)
        print("BUY", s["coins"], s["ammo"])
        assert s["ammo"]["lodge"]["dynamite"] >= 1
        page.click("#shop-play")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate("() => window.__yeetWar.killTeam('lodge')")
        wait_phase(page, "end", timeout=8000)
        assert "CREW DOWN" in page.locator("#end-title").inner_text()

        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        fire = page.locator("#btn-fire").bounding_box()
        stage = page.locator("#stage").bounding_box()
        print("PHONE fire", fire, "stage", stage)
        assert fire and fire["height"] >= 44
        assert stage and stage["height"] / 844 >= 0.54
        s = snap(page)
        for b in s["bobers"]:
            if b["alive"]:
                assert b["standing"] is True
                assert abs(b["vx"]) < 0.05
        shot(page, "test-match-mobile.png")

        page = browser.new_page(viewport={"width": 844, "height": 390})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        stage = page.locator("#stage").bounding_box()
        assert stage and stage["height"] / 390 >= 0.54
        shot(page, "test-match-mobile-landscape.png")

        print("PLAYTEST_OK")
        browser.close()


if __name__ == "__main__":
    main()

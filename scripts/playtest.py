"""Headless playtest: splash, vs-AI match, Stick+Snowball, crater, win/lose, phone."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=war1"


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
        reason = page.locator(".reason").inner_text()
        print("TITLE", repr(title))
        print("TAG", repr(tag))
        print("MISSION", repr(mission))
        print("REASON", repr(reason))
        assert title == "BOBER YEET WAR"
        assert tag == "Fan game by a holder."
        assert "Take turns. Aim true. Yeet the other crew off the bank." in mission
        assert "Turn-based stick fights" in reason
        assert "slingshot endless" in reason
        body = page.inner_text("body")
        low = body.lower()
        assert "worms" not in low
        assert "team17" not in low
        assert "team 17" not in low
        assert page.locator("#btn-play").inner_text() == "START"
        assert page.locator("#btn-museum").inner_text() == "MUSEUM"
        assert page.locator("#btn-history").inner_text() == "HISTORY"
        shot(page, "test-splash.png")

        page.click("#btn-museum")
        page.wait_for_timeout(250)
        assert "hidden" not in (page.locator("#museum").get_attribute("class") or "")
        cards = page.locator(".museum-card")
        assert cards.count() >= 5
        cats = page.locator(".museum-cat").all_inner_texts()
        print("CATS", cats)
        assert any("yeet" in c.lower() for c in cats)
        page.locator(".museum-card").nth(1).click()
        page.wait_for_timeout(200)
        detail = page.locator("#museum-detail").inner_text()
        print("MUSEUM", detail[:180])
        assert "yeet" in detail.lower() or "100" in detail
        shot(page, "test-museum.png")
        page.click("#museum-close")
        page.wait_for_timeout(150)

        page.click("#btn-history")
        page.wait_for_timeout(250)
        hist = page.locator("#history-body").inner_text()
        assert "Was Yeet" in hist or "was Yeet" in hist or "War" in hist
        shot(page, "test-history.png")
        page.click("#history-close")

        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.click("#btn-play")
        page.wait_for_function("() => window.__yeetWar && window.__yeetWar.snapshot().phase === 'aim'", timeout=10000)
        page.wait_for_timeout(400)
        s = snap(page)
        print("START", s["phase"], s["turn"], "wind", s["wind"], "n", len(s["bobers"]))
        assert s["phase"] == "aim"
        assert s["turn"] == "lodge"
        assert -4 <= s["wind"] <= 4
        assert len(s["bobers"]) == 6
        assert sum(1 for b in s["bobers"] if b["team"] == "lodge") == 3
        assert sum(1 for b in s["bobers"] if b["team"] == "creek") == 3
        assert all(b["hp"] == 100 for b in s["bobers"])
        assert page.locator("#btn-fire").inner_text() == "FIRE"
        box = page.locator("#btn-fire").bounding_box()
        assert box and box["height"] >= 44
        stage = page.locator("#stage").bounding_box()
        vp = page.viewport_size
        assert stage and vp
        frac = stage["height"] / vp["height"]
        print("STAGE_FRAC", frac)
        assert frac >= 0.54
        shot(page, "test-match.png")

        page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('stick'); w.setAim(22, 42); w.fire(); }")
        page.wait_for_function("() => window.__yeetWar.lastBlast", timeout=8000)
        page.wait_for_timeout(300)
        s = snap(page)
        print("BLAST1", s["lastBlast"], "craters", s["craterCount"], "phase", s["phase"])
        assert s["lastBlast"]
        assert s["lastBlast"]["weapon"] == "stick"
        assert s["lastBlast"]["r"] == 28
        assert s["craterCount"] >= 1
        shot(page, "test-crater.png")

        wait_phase(page, ["aim", "cpu", "end"], timeout=15000)
        page.wait_for_timeout(200)
        s = snap(page)
        print("AFTER1", s["phase"], s["turn"], "wind", s["wind"])
        if s["phase"] == "cpu":
            wait_phase(page, ["aim", "end"], timeout=20000)
            s = snap(page)
            print("AFTER_CPU", s["phase"], s["turn"], "wind", s["wind"])
        if s["phase"] == "aim":
            page.evaluate("() => { const w = window.__yeetWar; w.setWeapon('snow'); w.setAim(18, 38); w.fire(); }")
            page.wait_for_function(
                "() => { const b = window.__yeetWar.lastBlast; return b && b.weapon === 'snow'; }",
                timeout=8000,
            )
            s = snap(page)
            print("BLAST2", s["lastBlast"], "craters", s["craterCount"])
            assert s["lastBlast"]["weapon"] == "snow"
            assert s["lastBlast"]["r"] == 36
            assert s["craterCount"] >= 2
            shot(page, "test-snowball.png")
            wait_phase(page, ["aim", "cpu", "end"], timeout=15000)

        page.evaluate("() => window.__yeetWar.killTeam('creek')")
        wait_phase(page, "end", timeout=8000)
        page.wait_for_timeout(300)
        s = snap(page)
        print("WIN", s["winner"], page.locator("#end-title").inner_text())
        assert s["winner"] == "lodge"
        assert "BANK CLEARED" in page.locator("#end-title").inner_text()
        shot(page, "test-win.png")

        page.click("#end-restart")
        wait_phase(page, "aim", timeout=8000)
        page.evaluate("() => window.__yeetWar.killTeam('lodge')")
        wait_phase(page, "end", timeout=8000)
        s = snap(page)
        print("LOSE", s["winner"], page.locator("#end-title").inner_text())
        assert s["winner"] == "creek"
        assert "CREW DOWN" in page.locator("#end-title").inner_text()
        shot(page, "test-lose.png")

        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(400)
        shot(page, "test-splash-mobile.png")
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        fire = page.locator("#btn-fire").bounding_box()
        stage = page.locator("#stage").bounding_box()
        print("PHONE fire", fire, "stage", stage)
        assert fire and fire["height"] >= 44
        assert stage and stage["height"] / 844 >= 0.54
        shot(page, "test-match-mobile.png")

        page = browser.new_page(viewport={"width": 844, "height": 390})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.evaluate("() => localStorage.setItem('bober-yeet-war-tut', '1')")
        page.click("#btn-play")
        wait_phase(page, "aim", timeout=10000)
        stage = page.locator("#stage").bounding_box()
        fire = page.locator("#btn-fire").bounding_box()
        print("LANDSCAPE stage", stage, "fire", fire)
        assert stage and stage["height"] / 390 >= 0.54
        assert fire and fire["height"] >= 40
        shot(page, "test-match-mobile-landscape.png")

        print("PLAYTEST_OK")
        browser.close()


if __name__ == "__main__":
    main()

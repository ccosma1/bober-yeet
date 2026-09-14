"""Headless playtest: splash text, yeet, smash, mute, restart, next, mobile."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=gh4"


def shot(page, name):
    p = OUT / name
    page.screenshot(path=str(p), animations="disabled")
    print("shot", name)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(600)
        tag = page.locator(".tagline").inner_text()
        print("TAGLINE:", repr(tag))
        assert tag == "Fan game by a holder."
        assert page.locator(".tagline").count() == 1
        mission = page.locator(".mission").inner_text()
        reason = page.locator(".reason").inner_text()
        print("MISSION:", repr(mission))
        print("REASON:", repr(reason))
        assert "Yeet Bober. Clear the myth levels. Leave a score." in mission
        assert "Aim with skill" in reason
        assert "100 levels" in reason
        assert "not a token farm" in reason
        title = page.locator("h1").inner_text()
        print("TITLE:", repr(title))
        assert "BOBER YEET" in title
        hub = page.locator("#splash .hub-link a").get_attribute("href")
        assert "green-home-games" in hub
        assert page.locator("#btn-museum").inner_text() == "MUSEUM"
        assert page.locator("#btn-history").inner_text() == "HISTORY"
        page.click("#btn-museum")
        page.wait_for_timeout(300)
        assert "hidden" not in (page.locator("#museum").get_attribute("class") or "")
        cards = page.locator(".museum-card")
        assert cards.count() >= 3
        cards.nth(0).click()
        page.wait_for_timeout(200)
        assert "hidden" not in (page.locator("#museum-detail").get_attribute("class") or "")
        shot(page, "test-museum.png")
        page.click("#museum-close")
        page.wait_for_timeout(200)
        page.click("#btn-history")
        page.wait_for_timeout(300)
        assert "hidden" not in (page.locator("#history").get_attribute("class") or "")
        assert page.locator(".hist-node").count() >= 5
        assert page.locator(".hist-bar").count() >= 8
        shot(page, "test-history.png")
        page.click("#history-close")
        page.wait_for_timeout(200)
        shot(page, "test-splash.png")

        page.evaluate("() => localStorage.removeItem('bober-yeet-aim-tut')")
        page.fill("#player-name", "TestHolder")
        page.click("#btn-play")
        page.wait_for_timeout(800)
        shot(page, "test-level1.png")
        hud = page.locator("#level").inner_text()
        score_txt = page.locator("#score").inner_text()
        time_txt = page.locator("#time").inner_text()
        print("HUD", hud, time_txt, score_txt)
        assert "1/100" in hud
        assert "$BOBER" in score_txt
        assert "SCORE" not in score_txt
        tut = page.locator("#aim-tut")
        print("TUT", tut.get_attribute("class"), tut.inner_text())
        assert "hidden" not in (tut.get_attribute("class") or "")
        assert time_txt == "0:32"
        page.wait_for_timeout(1600)
        time_while_tut = page.locator("#time").inner_text()
        print("TIME WHILE TUT", time_while_tut)
        assert time_while_tut == "0:32"
        page.click("#aim-tut-ok")
        page.wait_for_timeout(150)
        assert "hidden" in (tut.get_attribute("class") or "")

        box = page.locator("#game").bounding_box()
        # sling is near left ~188/1280, y ~528/720
        sx = box["x"] + box["width"] * (188 / 1280)
        sy = box["y"] + box["height"] * (528 / 720)
        page.mouse.move(sx, sy)
        page.mouse.down()
        page.mouse.move(sx - 140, sy + 28, steps=10)
        page.wait_for_timeout(250)
        shot(page, "test-aim.png")
        page.mouse.up()
        page.wait_for_timeout(700)
        shot(page, "test-mid-flight.png")
        last_pop = page.evaluate("() => window.__lastPop || ''")
        print("LAST POP", last_pop)
        src = page.evaluate("() => fetch('js/game.js').then(r => r.text())")
        assert "+1 $BOBER" in src
        page.wait_for_timeout(2000)
        shot(page, "test-after-shot.png")
        print("SCORE after shot", page.locator("#score").inner_text())
        print("ENDCARD", page.locator("#endcard").get_attribute("class"), page.locator("#end-title").inner_text())
        print("AMMO", page.locator("#ammo img").count(), "used", page.locator("#ammo img.used").count())

        if "hidden" not in (page.locator("#endcard").get_attribute("class") or ""):
            page.click("#end-restart")
        else:
            page.click("#btn-mute")
            pressed = page.locator("#btn-mute").get_attribute("aria-pressed")
            print("MUTE", pressed)
            page.click("#btn-restart")
        page.wait_for_timeout(400)
        print("AFTER RESTART", page.locator("#score").inner_text(), page.locator("#time").inner_text())
        shot(page, "test-restart.png")

        page.click("#btn-next")
        page.wait_for_timeout(500)
        print("AFTER NEXT", page.locator("#level").inner_text())
        shot(page, "test-level2.png")

        # later level with star
        for _ in range(3):
            page.click("#btn-next")
            page.wait_for_timeout(250)
        print("LATER", page.locator("#level").inner_text())
        page.wait_for_timeout(1600)
        shot(page, "test-later.png")
        print("L5 score after wait", page.locator("#score").inner_text())
        page.click("#btn-next")
        page.wait_for_timeout(400)
        print("L6", page.locator("#level").inner_text())
        shot(page, "test-level6.png")

        # mobile viewport
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(400)
        shot(page, "test-mobile-portrait.png")
        page.set_viewport_size({"width": 844, "height": 390})
        page.wait_for_timeout(400)
        shot(page, "test-mobile-landscape.png")

        # faceplant-ish: dump into ground
        page.set_viewport_size({"width": 1280, "height": 720})
        page.click("#btn-restart")
        page.wait_for_timeout(400)
        box = page.locator("#game").bounding_box()
        sx = box["x"] + box["width"] * (188 / 1280)
        sy = box["y"] + box["height"] * (528 / 720)
        page.mouse.move(sx, sy)
        page.mouse.down()
        page.mouse.move(sx, sy - 100, steps=6)
        page.mouse.up()
        page.wait_for_timeout(1800)
        shot(page, "test-faceplant-attempt.png")
        print("TOAST", page.locator("#toast").inner_text())

        console_errors = []
        page.on("pageerror", lambda e: console_errors.append(str(e)))
        print("DONE")
        browser.close()


if __name__ == "__main__":
    main()

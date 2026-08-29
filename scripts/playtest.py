"""Headless playtest: splash text, yeet, smash, mute, restart, next, mobile."""
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parents[1] / "assets" / "ref"
OUT.mkdir(parents=True, exist_ok=True)
URL = "http://127.0.0.1:8765/?v=7"


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
        title = page.locator("h1").inner_text()
        print("TITLE:", repr(title))
        assert "BOBER YEET" in title
        shot(page, "test-splash.png")

        page.fill("#player-name", "TestHolder")
        page.click("#btn-play")
        page.wait_for_timeout(800)
        shot(page, "test-level1.png")
        hud = page.locator("#level").inner_text()
        print("HUD", hud, page.locator("#time").inner_text(), page.locator("#score").inner_text())
        assert "1/6" in hud

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
        page.wait_for_timeout(450)
        shot(page, "test-mid-flight.png")
        page.wait_for_timeout(2400)
        shot(page, "test-after-shot.png")
        print("SCORE after shot", page.locator("#score").inner_text())
        print("ENDCARD", page.locator("#endcard").get_attribute("class"), page.locator("#end-title").inner_text())
        print("AMMO", page.locator("#ammo img").count(), "used", page.locator("#ammo img.used").count())

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

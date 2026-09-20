"""Optional two-page Link Battle smoke (needs PeerJS + network)."""
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8765/?v=war6"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        host = browser.new_page()
        guest = browser.new_page()
        host.goto(URL, wait_until="networkidle", timeout=30000)
        guest.goto(URL, wait_until="networkidle", timeout=30000)
        host.click("#mode-link")
        host.click("#btn-host")
        host.wait_for_function(
            "() => (document.getElementById('room-code')||{}).textContent && document.getElementById('room-code').textContent.length === 4",
            timeout=20000,
        )
        code = host.locator("#room-code").inner_text().strip()
        print("CODE", code)
        guest.click("#mode-link")
        guest.click("#btn-join")
        guest.fill("#join-code", code)
        guest.click("#btn-connect")
        host.wait_for_function(
            "() => (document.getElementById('host-status')||{}).textContent && document.getElementById('host-status').textContent.indexOf('Friend') >= 0",
            timeout=20000,
        )
        print("HOST", host.locator("#host-status").inner_text())
        print("GUEST", guest.locator("#join-status").inner_text())
        host.click("#btn-play")
        host.wait_for_function("() => window.__yeetWar && window.__yeetWar.snapshot().phase === 'aim'", timeout=15000)
        guest.wait_for_function("() => window.__yeetWar && window.__yeetWar.snapshot().phase === 'aim'", timeout=15000)
        print("HOST SNAP", host.evaluate("() => window.__yeetWar.snapshot().phase"))
        print("GUEST SNAP", guest.evaluate("() => window.__yeetWar.snapshot().phase"))
        print("LINKTEST_OK")
        browser.close()


if __name__ == "__main__":
    main()

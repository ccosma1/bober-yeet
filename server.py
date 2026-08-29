"""Tiny static server + shared high-score board. No login."""
from __future__ import annotations

import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
SCORES = DATA / "scores.json"
PORT = 8765
LOCK = threading.Lock()


def load_scores() -> list:
    if not SCORES.exists():
        return []
    try:
        rows = json.loads(SCORES.read_text(encoding="utf-8"))
        return rows if isinstance(rows, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def save_scores(rows: list) -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    tmp = SCORES.with_suffix(".tmp")
    tmp.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(SCORES)


def clean_name(raw) -> str:
    s = "".join(ch for ch in str(raw or "") if ch.isalnum() or ch in " -.'")
    return " ".join(s.split())[:16]


def upsert(rows: list, body: dict) -> list:
    name = clean_name(body.get("name"))
    try:
        score = int(body.get("score", 0))
        levels = int(body.get("levels", 1))
    except (TypeError, ValueError):
        return rows
    if not name or score < 0:
        return rows
    levels = max(1, min(6, levels))
    entry = {
        "name": name,
        "score": score,
        "levels": levels,
        "at": int(body.get("at") or 0) or __import__("time").time_ns() // 1_000_000,
    }
    found = False
    for i, row in enumerate(rows):
        if str(row.get("name", "")).lower() == name.lower():
            found = True
            if score > int(row.get("score") or 0):
                rows[i] = entry
            break
    if not found:
        rows.append(entry)
    rows.sort(key=lambda r: (-int(r.get("score") or 0), -int(r.get("levels") or 0)))
    return rows[:50]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print("[%s] " % self.log_date_time_string() + fmt % args)

    def _json(self, code, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if urlparse(self.path).path == "/api/scores":
            with LOCK:
                self._json(200, load_scores())
            return
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/scores":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > 4096:
            self._json(413, {"error": "too big"})
            return
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8"))
            if not isinstance(body, dict):
                raise ValueError("not an object")
        except (json.JSONDecodeError, ValueError, UnicodeDecodeError):
            self._json(400, {"error": "bad json"})
            return
        with LOCK:
            rows = upsert(load_scores(), body)
            save_scores(rows)
        self._json(200, rows)


if __name__ == "__main__":
    DATA.mkdir(parents=True, exist_ok=True)
    if not SCORES.exists():
        save_scores([])
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("Bober Yeet  http://127.0.0.1:%s/" % PORT)
    print("Scores are shared for every player on this machine / LAN.")
    httpd.serve_forever()

#!/usr/bin/env python3
"""One-time (and twice-yearly) Spotify authorization helper.

Produces the SPOTIFY_REFRESH_TOKEN that tools/fetch/fetch_spotify.py uses in CI.
Run this locally — never in CI:

    uv run python tools/spotify_auth.py

Spotify refresh tokens have a hard 6-month lifetime measured from the original
authorization (refreshing access tokens does NOT extend it). When the token
expires, the daily data workflow opens a GitHub issue as a reminder; fix it by
running this script again and updating the repo secret:

    gh secret set SPOTIFY_REFRESH_TOKEN

Requires SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in the environment or
~/.claude/.env; prompts for them if absent. The Spotify app must list
http://127.0.0.1:8888/callback as a redirect URI.
"""

import base64
import os
import re
import secrets
import sys
import threading
import urllib.parse
import webbrowser
from datetime import date, timedelta
from getpass import getpass
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import requests

REDIRECT_URI = "http://127.0.0.1:8888/callback"
SCOPE = "user-top-read"
AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"


def get_secret(name: str) -> str | None:
    """Resolve a secret: process env first, then ~/.claude/.env."""
    val = os.environ.get(name)
    if val:
        return val

    env_file = Path.home() / ".claude" / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
            m = re.match(rf"^\s*{re.escape(name)}\s*=\s*(.+)$", line)
            if m:
                return m.group(1).strip()

    return None


class _CallbackHandler(BaseHTTPRequestHandler):
    """Catches the OAuth redirect and stashes the authorization code."""

    code: str | None = None
    error: str | None = None
    expected_state: str = ""

    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if params.get("state", [""])[0] != self.expected_state:
            _CallbackHandler.error = "state mismatch (possible CSRF); run again"
        elif "code" in params:
            _CallbackHandler.code = params["code"][0]
        else:
            _CallbackHandler.error = params.get("error", ["unknown error"])[0]

        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        body = "Authorized — you can close this tab." if _CallbackHandler.code else f"Failed: {_CallbackHandler.error}"
        self.wfile.write(f"<html><body><h2>{body}</h2></body></html>".encode())

    def log_message(self, *args):
        pass


def main() -> None:
    client_id = get_secret("SPOTIFY_CLIENT_ID") or input("Spotify Client ID: ").strip()
    client_secret = get_secret("SPOTIFY_CLIENT_SECRET") or getpass("Spotify Client Secret: ").strip()
    if not client_id or not client_secret:
        print("ERROR: client ID and secret are required", file=sys.stderr)
        sys.exit(1)

    state = secrets.token_urlsafe(16)
    _CallbackHandler.expected_state = state
    auth_url = AUTH_URL + "?" + urllib.parse.urlencode({
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
        "state": state,
    })

    server = HTTPServer(("127.0.0.1", 8888), _CallbackHandler)
    threading.Thread(target=server.handle_request, daemon=True).start()

    print("Opening Spotify consent page (approve access, then return here)...")
    webbrowser.open(auth_url)
    print(f"If the browser did not open, visit:\n{auth_url}\n")

    # handle_request returns after the single redirect arrives
    while _CallbackHandler.code is None and _CallbackHandler.error is None:
        pass
    server.server_close()

    if _CallbackHandler.error:
        print(f"ERROR: authorization failed: {_CallbackHandler.error}", file=sys.stderr)
        sys.exit(1)

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = requests.post(TOKEN_URL, data={
        "grant_type": "authorization_code",
        "code": _CallbackHandler.code,
        "redirect_uri": REDIRECT_URI,
    }, headers={"Authorization": f"Basic {basic}"}, timeout=15)
    resp.raise_for_status()
    refresh_token = resp.json().get("refresh_token")
    if not refresh_token:
        print(f"ERROR: no refresh_token in response: {resp.json()}", file=sys.stderr)
        sys.exit(1)

    expires = date.today() + timedelta(days=180)
    print("\nSuccess. Add the token as a repo secret (prompts for the value, paste it there):\n")
    print("    gh secret set SPOTIFY_REFRESH_TOKEN\n")
    print(f"Refresh token (valid until ~{expires}):\n\n{refresh_token}\n")


if __name__ == "__main__":
    main()

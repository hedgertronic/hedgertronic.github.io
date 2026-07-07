#!/usr/bin/env python3
"""Update the "On Repeat" album in data/personal.json from Spotify listening data.

Derives the most-listened album from the user's top 50 tracks over the short-term
window (~4 weeks): albums are ranked by how many top tracks they contribute, with
the best track rank as tiebreaker. Full albums are preferred over singles when any
qualify.

Auth: SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN from the
environment (repo secrets in CI, ~/.claude/.env locally). Spotify refresh tokens
hard-expire 6 months after authorization; on expiry this script keeps the existing
album, emits a reauth flag for the workflow (which opens a reminder issue), and
exits 0. Re-auth: run tools/spotify_auth.py and update the repo secret.
"""

import base64
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

import requests

from common import PROJECT_ROOT, load_json, write_json_if_changed

TOKEN_URL = "https://accounts.spotify.com/api/token"
TOP_TRACKS_URL = "https://api.spotify.com/v1/me/top/tracks"
PERSONAL_FILE = PROJECT_ROOT / "data" / "personal.json"


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


def flag_reauth_for_workflow() -> None:
    """Signal the Actions step that re-authorization is needed (no-op locally)."""
    output_file = os.environ.get("GITHUB_OUTPUT")
    if output_file:
        with open(output_file, "a", encoding="utf-8") as f:
            f.write("spotify_reauth=true\n")


def get_access_token(client_id: str, client_secret: str, refresh_token: str) -> str | None:
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    resp = requests.post(TOKEN_URL, data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }, headers={"Authorization": f"Basic {basic}"}, timeout=15)

    if resp.status_code == 400 and resp.json().get("error") == "invalid_grant":
        print(
            "WARNING: SPOTIFY_REAUTH_REQUIRED — refresh token expired (6-month limit). "
            "Run tools/spotify_auth.py and update the SPOTIFY_REFRESH_TOKEN secret. "
            "Keeping existing album.",
            file=sys.stderr,
        )
        flag_reauth_for_workflow()
        return None

    resp.raise_for_status()
    return resp.json()["access_token"]


def pick_top_album(tracks: list[dict]) -> dict | None:
    """Most-listened album: ranked by top-track count, best rank breaks ties."""
    tallies: dict[str, dict] = defaultdict(lambda: {"count": 0, "best_rank": len(tracks), "album": None})
    for rank, track in enumerate(tracks):
        album = track.get("album") or {}
        album_id = album.get("id")
        if not album_id:
            continue
        entry = tallies[album_id]
        entry["count"] += 1
        entry["best_rank"] = min(entry["best_rank"], rank)
        entry["album"] = album

    if not tallies:
        return None

    def sort_key(e: dict) -> tuple:
        return (-e["count"], e["best_rank"])

    ranked = sorted(tallies.values(), key=sort_key)
    full_albums = [e for e in ranked if e["album"].get("album_type") == "album"]
    return (full_albums[0] if full_albums else ranked[0])["album"]


def main() -> None:
    client_id = get_secret("SPOTIFY_CLIENT_ID")
    client_secret = get_secret("SPOTIFY_CLIENT_SECRET")
    refresh_token = get_secret("SPOTIFY_REFRESH_TOKEN")
    if not all([client_id, client_secret, refresh_token]):
        print("Spotify credentials not configured; skipping (set SPOTIFY_CLIENT_ID/SECRET/REFRESH_TOKEN)")
        return

    try:
        access_token = get_access_token(client_id, client_secret, refresh_token)
        if access_token is None:
            return

        resp = requests.get(
            TOP_TRACKS_URL,
            params={"time_range": "short_term", "limit": 50},
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
        resp.raise_for_status()
        tracks = resp.json().get("items", [])
    except requests.RequestException as e:
        print(f"WARNING: Spotify fetch failed ({e}); keeping existing album", file=sys.stderr)
        return

    album = pick_top_album(tracks)
    if album is None:
        print("WARNING: no top tracks returned; keeping existing album", file=sys.stderr)
        return

    images = album.get("images") or []
    cover = images[0]["url"] if images else ""
    artists = ", ".join(a["name"] for a in album.get("artists", []))

    data = load_json(PERSONAL_FILE)
    existing = data.get("listening", {}).get("album", {})
    updated = {
        "title": album.get("name") or existing.get("title"),
        "artist": artists or existing.get("artist"),
        "cover": cover or existing.get("cover"),
        "url": (album.get("external_urls") or {}).get("spotify") or existing.get("url"),
    }
    data.setdefault("listening", {})["album"] = updated

    if write_json_if_changed(PERSONAL_FILE, data):
        print(f"Updated On Repeat album: {updated['title']} — {updated['artist']}")
    else:
        print("On Repeat album unchanged")


if __name__ == "__main__":
    main()

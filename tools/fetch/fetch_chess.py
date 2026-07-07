#!/usr/bin/env python3
"""Fetch chess ratings and update data/personal.json chess.links.*.rating.

Chess.com: GET https://api.chess.com/pub/player/hedgertronic/stats
  → chess_rapid.last.rating

USCF: Scrapes https://msa.uschess.org/MbrDtlMain.php?<member_id>
  → Regular rating parsed from the page HTML.
  NOTE: This page is behind Cloudflare; scraping may be blocked in CI.
  On any parse failure the existing rating is kept silently.

Member ID is read from the existing personal.json uscf.url field.
"""

import re
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from common import PROJECT_ROOT, load_json, write_json_if_changed

DATA_FILE = PROJECT_ROOT / "data" / "personal.json"
CHESSCOM_STATS_URL = "https://api.chess.com/pub/player/hedgertronic/stats"
USCF_MSA_BASE = "https://msa.uschess.org/MbrDtlMain.php"
USER_AGENT = "hedgertronic-portfolio-fetcher/1.0 (chess rating sync)"

# Matches "Regular" near a numeric rating anywhere on the USCF page
# The legacy page renders rows like: Regular  1224  ...
USCF_RATING_RE = re.compile(
    r"Regular\s*(?:<[^>]+>)*\s*(?:<[^>]+>)*\s*(\d{3,4})",
    re.IGNORECASE | re.DOTALL,
)


def fetch_chesscom_rapid() -> int | None:
    """Fetch the current Chess.com rapid rating. Returns None on failure."""
    try:
        resp = requests.get(
            CHESSCOM_STATS_URL,
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        rating = data.get("chess_rapid", {}).get("last", {}).get("rating")
        if isinstance(rating, int):
            return rating
        print("WARNING: chess.com rapid rating not found in response", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"WARNING: Failed to fetch chess.com stats: {exc}", file=sys.stderr)
        return None


def extract_member_id(uscf_url: str) -> str | None:
    """Extract the numeric USCF member ID from a ratings.uschess.org URL."""
    m = re.search(r"/player/(\d+)", uscf_url)
    return m.group(1) if m else None


def fetch_uscf_regular(member_id: str) -> int | None:
    """Scrape the Regular rating from the USCF legacy MSA page.

    Returns None on any failure (Cloudflare block, parse error, etc.) so
    the caller can keep the existing value.
    """
    url = f"{USCF_MSA_BASE}?{member_id}"
    try:
        resp = requests.get(
            url,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
            },
            timeout=15,
        )
        if resp.status_code != 200:
            print(
                f"WARNING: USCF page returned HTTP {resp.status_code}; "
                "keeping existing rating",
                file=sys.stderr,
            )
            return None

        m = USCF_RATING_RE.search(resp.text)
        if m:
            return int(m.group(1))
        print(
            "WARNING: Regular rating not found in USCF page; keeping existing",
            file=sys.stderr,
        )
        return None
    except Exception as exc:
        print(f"WARNING: Failed to fetch USCF page: {exc}", file=sys.stderr)
        return None


def main() -> None:
    data = load_json(DATA_FILE)
    chess = data.get("chess", {}).get("links", {})
    updated = False

    # Chess.com rapid rating
    chesscom_entry = chess.get("chesscom", {})
    new_chesscom = fetch_chesscom_rapid()
    if new_chesscom is not None and chesscom_entry.get("rating") != new_chesscom:
        chesscom_entry["rating"] = new_chesscom
        updated = True
    elif new_chesscom is None:
        print("WARNING: Chess.com rating unchanged (fetch failed)")

    # USCF regular rating
    uscf_entry = chess.get("uscf", {})
    uscf_url = uscf_entry.get("url", "")
    member_id = extract_member_id(uscf_url)

    if member_id:
        new_uscf = fetch_uscf_regular(member_id)
        if new_uscf is not None and uscf_entry.get("rating") != new_uscf:
            uscf_entry["rating"] = new_uscf
            updated = True
        elif new_uscf is None:
            print("WARNING: USCF rating unchanged (fetch failed or Cloudflare blocked)")
    else:
        print("WARNING: Could not extract USCF member ID from URL")

    if updated:
        written = write_json_if_changed(DATA_FILE, data)
        if written:
            print(f"Updated {DATA_FILE.relative_to(PROJECT_ROOT)}")
        else:
            print("personal.json: no effective change after formatting")
    else:
        print("personal.json (chess): no changes")


if __name__ == "__main__":
    main()

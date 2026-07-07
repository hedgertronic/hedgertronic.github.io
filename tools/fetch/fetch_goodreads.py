#!/usr/bin/env python3
"""Fetch the currently-reading book from Goodreads and update data/personal.json.

Reads the shelf RSS feed at:
  https://www.goodreads.com/review/list_rss/<USER_ID>?shelf=currently-reading

USER_ID resolution order:
  1. GOODREADS_USER_ID environment variable
  2. "goodreadsUserId" key in data/site.json
  3. If neither is available, prints a skip message and exits 0

Parses the first <item> from the feed for:
  title, author_name, book_large_image_url, link

If the shelf is empty, the existing book entry is kept unchanged.
"""

import os
import sys
from pathlib import Path

import defusedxml.ElementTree as ET

import requests

sys.path.insert(0, str(Path(__file__).parent))
from common import PROJECT_ROOT, load_json, write_json_if_changed

DATA_FILE = PROJECT_ROOT / "data" / "personal.json"
SITE_FILE = PROJECT_ROOT / "data" / "site.json"
GR_RSS_BASE = "https://www.goodreads.com/review/list_rss"
USER_AGENT = "hedgertronic-portfolio-fetcher/1.0 (goodreads currently-reading)"


def resolve_user_id() -> str | None:
    """Return Goodreads user ID from env or site.json, or None if not configured."""
    uid = os.environ.get("GOODREADS_USER_ID", "").strip()
    if uid:
        return uid
    if SITE_FILE.exists():
        site = load_json(SITE_FILE)
        if isinstance(site, dict):
            uid = str(site.get("goodreadsUserId", "")).strip()
            if uid:
                return uid
    return None


def fetch_current_book(user_id: str) -> dict | None:
    """Fetch the first currently-reading book. Returns None on failure or empty shelf."""
    url = f"{GR_RSS_BASE}/{user_id}?shelf=currently-reading"
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
    except Exception as exc:
        print(f"WARNING: Failed to fetch Goodreads RSS: {exc}", file=sys.stderr)
        return None

    # RSS: <rss><channel><item>...</item></channel></rss>
    channel = root.find("channel")
    if channel is None:
        print("WARNING: No <channel> in Goodreads RSS", file=sys.stderr)
        return None

    item = channel.find("item")
    if item is None:
        print("Goodreads shelf is empty; keeping existing book")
        return None

    def text(tag: str) -> str:
        el = item.find(tag)
        return (el.text or "").strip() if el is not None else ""

    title = text("title")
    link = text("link")
    author = text("author_name")
    cover = text("book_large_image_url")
    book_id = text("book_id")

    if not title:
        print("WARNING: Goodreads item has no title; keeping existing book", file=sys.stderr)
        return None

    # Card space is tight: drop the subtitle ("Title: The Story of...")
    title = title.split(":")[0].strip()

    # The item <link> is the user's review with tracking params; the book page is cleaner
    url = f"https://www.goodreads.com/book/show/{book_id}" if book_id else link.split("?")[0]

    return {
        "title": title,
        "author": author,
        "cover": cover,
        "url": url,
    }


def main() -> None:
    user_id = resolve_user_id()
    if not user_id:
        print(
            "SKIP: Goodreads user ID not configured. "
            "Set GOODREADS_USER_ID env var or add 'goodreadsUserId' to data/site.json."
        )
        return

    data = load_json(DATA_FILE)
    book = fetch_current_book(user_id)

    if book is None:
        print("personal.json (reading): no changes")
        return

    reading = data.get("reading", {})
    current = reading.get("book", {})

    if current == book:
        print("personal.json (reading): no changes")
        return

    reading["book"] = book
    data["reading"] = reading

    written = write_json_if_changed(DATA_FILE, data)
    if written:
        print(f"Updated {DATA_FILE.relative_to(PROJECT_ROOT)}")
    else:
        print("personal.json: no effective change after formatting")


if __name__ == "__main__":
    main()

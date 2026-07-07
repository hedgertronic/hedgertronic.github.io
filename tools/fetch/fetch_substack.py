#!/usr/bin/env python3
"""Fetch new Substack posts and append them to data/writing-longform.json.

Derives the feed URL from the Substack social link in data/site.json:
  substack.com/@<handle>  →  https://<handle>.substack.com/feed

For each RSS item not already present (matched by url), appends an entry
matching the existing shape:
  title, date (YYYY-MM-DD), url, source, thumbnail, authors

Existing entries are never removed or reordered. The feed having no posts
(or returning 404) is handled gracefully — exits 0, no changes.

Uses defusedxml to guard against malicious RSS payloads (XXE, billion-laughs).
"""

import re
import sys
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path

import defusedxml.ElementTree as ET
from xml.etree.ElementTree import Element  # type annotation only; parsing uses defusedxml
import requests

sys.path.insert(0, str(Path(__file__).parent))
from common import PROJECT_ROOT, load_json, write_json_if_changed

DATA_FILE = PROJECT_ROOT / "data" / "writing-longform.json"
SITE_FILE = PROJECT_ROOT / "data" / "site.json"
USER_AGENT = "hedgertronic-portfolio-fetcher/1.0 (substack feed sync)"
SOURCE_LABEL = "Sliding Risers"
AUTHORS = ["Josh Hejka"]

# Namespace map for RSS extensions used by Substack
RSS_NS = {
    "media": "http://search.yahoo.com/mrss/",
    "itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
}


def resolve_feed_url() -> str | None:
    """Derive the Substack feed URL from data/site.json socials."""
    if not SITE_FILE.exists():
        return None
    site = load_json(SITE_FILE)
    socials = site.get("socials", [])
    for s in socials:
        if s.get("platform") == "substack":
            url = s.get("url", "")
            # substack.com/@handle  or  <handle>.substack.com
            m = re.search(r"substack\.com/@(\w+)", url)
            if m:
                return f"https://{m.group(1)}.substack.com/feed"
            m = re.search(r"([\w-]+)\.substack\.com", url)
            if m:
                return f"https://{m.group(1)}.substack.com/feed"
    return None


def parse_date(rss_date: str) -> str:
    """Convert an RSS pubDate string to YYYY-MM-DD. Returns empty string on failure."""
    try:
        dt = parsedate_to_datetime(rss_date)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        try:
            # Fall back to ISO-style parse
            dt = datetime.fromisoformat(rss_date[:10])
            return dt.strftime("%Y-%m-%d")
        except Exception:
            return ""


def extract_thumbnail(item: Element) -> str:
    """Try multiple locations in an RSS item for a thumbnail URL."""
    # <enclosure> tag
    enc = item.find("enclosure")
    if enc is not None:
        enc_url = enc.get("url", "")
        if enc_url:
            return enc_url

    # <media:content> or <media:thumbnail>
    for tag in ("media:content", "media:thumbnail"):
        el = item.find(tag, RSS_NS)
        if el is not None:
            u = el.get("url", "")
            if u:
                return u

    # <itunes:image href="...">
    img = item.find("itunes:image", RSS_NS)
    if img is not None:
        u = img.get("href", "")
        if u:
            return u

    return ""


def fetch_feed(feed_url: str) -> list[dict] | None:
    """Fetch and parse the RSS feed. Returns list of entry dicts, or None on error."""
    try:
        resp = requests.get(
            feed_url,
            headers={"User-Agent": USER_AGENT},
            timeout=15,
        )
        if resp.status_code == 404:
            print(f"Substack feed returned 404 ({feed_url}); no posts yet")
            return []
        resp.raise_for_status()
    except requests.HTTPError as exc:
        print(f"WARNING: HTTP error fetching Substack feed: {exc}", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"WARNING: Failed to fetch Substack feed: {exc}", file=sys.stderr)
        return None

    try:
        root = ET.fromstring(resp.content)
    except Exception as exc:
        print(f"WARNING: Failed to parse Substack RSS: {exc}", file=sys.stderr)
        return None

    channel = root.find("channel")
    if channel is None:
        return []

    entries = []
    for item in channel.findall("item"):

        def text(tag: str) -> str:
            el = item.find(tag)
            return (el.text or "").strip() if el is not None else ""

        title = text("title")
        link = text("link")
        pub_date = text("pubDate")

        if not title or not link:
            continue

        date_str = parse_date(pub_date)
        thumbnail = extract_thumbnail(item)

        entry: dict = {
            "title": title,
            "date": date_str,
            "url": link,
            "source": SOURCE_LABEL,
            "authors": AUTHORS,
        }
        if thumbnail:
            entry["thumbnail"] = thumbnail

        entries.append(entry)

    return entries


def main() -> None:
    feed_url = resolve_feed_url()
    if not feed_url:
        print("SKIP: Could not determine Substack feed URL from data/site.json")
        return

    existing = load_json(DATA_FILE)
    existing_urls = {e.get("url") for e in existing}

    new_entries = fetch_feed(feed_url)
    if new_entries is None:
        print("writing-longform.json: no changes (fetch failed)")
        return

    to_add = [e for e in new_entries if e.get("url") not in existing_urls]

    if not to_add:
        print("writing-longform.json: no new Substack posts")
        return

    # Append new entries; preserve existing order
    combined = existing + to_add
    written = write_json_if_changed(DATA_FILE, combined)
    if written:
        print(
            f"Updated {DATA_FILE.relative_to(PROJECT_ROOT)} "
            f"(added {len(to_add)} post{'s' if len(to_add) != 1 else ''})"
        )
    else:
        print("writing-longform.json: no effective change after formatting")


if __name__ == "__main__":
    main()

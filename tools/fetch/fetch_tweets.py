#!/usr/bin/env python3
"""Fetch tweet engagement stats and update data/writing-shortform.json.

For each entry, extracts the status ID from the Twitter/X url and calls
the fxtwitter unofficial API (https://api.fxtwitter.com) to update:
  - retweets (tweet.retweets)
  - likes    (tweet.likes)
  - bookmarks (tweet.bookmarks)

Per-tweet failures keep the existing numbers. A 1-second sleep is inserted
between requests to be respectful of the unofficial endpoint.
"""

import re
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from common import PROJECT_ROOT, load_json, write_json_if_changed

DATA_FILE = PROJECT_ROOT / "data" / "writing-shortform.json"
FXTWITTER_BASE = "https://api.fxtwitter.com/hedgertronic/status"
STATUS_ID_RE = re.compile(r"(?:twitter\.com|x\.com)/\w+/status/(\d+)")
USER_AGENT = "hedgertronic-portfolio-fetcher/1.0 (tweet stats sync)"


def extract_status_id(url: str) -> str | None:
    """Extract the numeric status ID from a Twitter/X URL."""
    m = STATUS_ID_RE.search(url)
    return m.group(1) if m else None


def fetch_tweet_stats(status_id: str) -> dict | None:
    """Fetch engagement stats for one tweet. Returns None on any failure."""
    url = f"{FXTWITTER_BASE}/{status_id}"
    try:
        resp = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        tweet = data.get("tweet")
        if not isinstance(tweet, dict):
            raise ValueError(f"Unexpected tweet shape: {type(tweet)}")
        return tweet
    except Exception as exc:
        print(f"WARNING: Failed to fetch tweet {status_id}: {exc}", file=sys.stderr)
        return None


def main() -> None:
    entries = load_json(DATA_FILE)
    updated = False

    for entry in entries:
        url = entry.get("url", "")
        status_id = extract_status_id(url)
        if not status_id:
            continue

        tweet = fetch_tweet_stats(status_id)
        if tweet is None:
            print(f"WARNING: Keeping existing stats for tweet {status_id}")
            time.sleep(1)
            continue

        for field in ("retweets", "likes", "bookmarks"):
            val = tweet.get(field)
            if val is not None and isinstance(val, int):
                if entry.get(field) != val:
                    entry[field] = val
                    updated = True

        time.sleep(1)

    if updated:
        written = write_json_if_changed(DATA_FILE, entries)
        if written:
            print(f"Updated {DATA_FILE.relative_to(PROJECT_ROOT)}")
        else:
            print("writing-shortform.json: no effective change after formatting")
    else:
        print("writing-shortform.json: no changes")


if __name__ == "__main__":
    main()

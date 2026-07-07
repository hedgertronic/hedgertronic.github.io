#!/usr/bin/env python3
"""Fetch GitHub repository stats and update data/lab-projects.json.

For each entry whose url matches github.com/hedgertronic/<repo>, fetches:
  - stars (stargazers_count)
  - forks (forks_count)
  - language
  - description (unless descriptionLocked is true on the entry)

Gist entries (gist.github.com) are skipped silently. On any per-repo fetch
failure the existing entry values are kept. The whole script exits 0 regardless
so one bad repo cannot stop the workflow.

Sets descriptionLocked: true on the site repo entry so future runs never
overwrite the custom "This website!" description.
"""

import os
import re
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))
from common import PROJECT_ROOT, load_json, write_json_if_changed

DATA_FILE = PROJECT_ROOT / "data" / "lab-projects.json"
GITHUB_API_BASE = "https://api.github.com/repos/hedgertronic"
GITHUB_REPO_RE = re.compile(r"github\.com/hedgertronic/([^/?#]+)")
SITE_REPO = "hedgertronic.github.io"


def _headers(token: str | None) -> dict:
    h = {"User-Agent": "hedgertronic-portfolio-fetcher/1.0"}
    if token:
        h["Authorization"] = f"Bearer {token}"
    return h


def fetch_repo(repo: str, token: str | None) -> dict | None:
    """Fetch a single GitHub repo's metadata. Returns None on any error."""
    url = f"{GITHUB_API_BASE}/{repo}"
    try:
        resp = requests.get(url, headers=_headers(token), timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict):
            raise ValueError(f"Unexpected response type: {type(data)}")
        return data
    except Exception as exc:
        print(f"WARNING: Failed to fetch {repo}: {exc}", file=sys.stderr)
        return None


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN")
    entries = load_json(DATA_FILE)
    updated = False

    for entry in entries:
        url = entry.get("url", "")

        # Skip gists silently
        if "gist.github.com" in url:
            continue

        m = GITHUB_REPO_RE.search(url)
        if not m:
            continue

        repo = m.group(1)

        # Ensure the site repo has descriptionLocked so this run doesn't clobber it
        if repo == SITE_REPO and not entry.get("descriptionLocked"):
            entry["descriptionLocked"] = True
            updated = True

        api = fetch_repo(repo, token)
        if api is None:
            print(f"WARNING: Keeping existing data for {repo}")
            continue

        if api.get("stargazers_count") is not None:
            entry["stars"] = api["stargazers_count"]
            updated = True

        if api.get("forks_count") is not None:
            entry["forks"] = api["forks_count"]
            updated = True

        if api.get("language"):
            entry["language"] = api["language"]
            updated = True

        # Only update description when the entry doesn't have descriptionLocked
        if not entry.get("descriptionLocked"):
            api_desc = (api.get("description") or "").strip()
            if api_desc and api_desc != entry.get("description"):
                entry["description"] = api_desc
                updated = True

        time.sleep(0.3)

    if updated:
        written = write_json_if_changed(DATA_FILE, entries)
        if written:
            print(f"Updated {DATA_FILE.relative_to(PROJECT_ROOT)}")
        else:
            print("lab-projects.json: no effective change after formatting")
    else:
        print("lab-projects.json: no changes")


if __name__ == "__main__":
    main()

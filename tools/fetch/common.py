"""Shared utilities for data fetching scripts.

Provides JSON I/O helpers that preserve key order and emit consistent formatting.
Every fetcher must follow the prime directive: on any fetch failure or empty/suspicious
response, keep existing values and exit 0 with a warning — never blank a file, never
crash the whole workflow.
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent


def load_json(path: Path) -> dict | list:
    """Load a JSON file, preserving key order."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json_if_changed(path: Path, data: dict | list) -> bool:
    """Write JSON with 2-space indent and trailing newline, only if content changed.

    Uses ensure_ascii=False so Unicode characters (emoji, curly quotes, etc.) are
    stored as-is rather than escaped — prevents spurious diffs when only numeric
    stats change.

    Returns True if the file was written, False if content was identical.
    """
    new_content = json.dumps(data, indent=2, ensure_ascii=False) + "\n"

    if path.exists():
        existing = path.read_text(encoding="utf-8")
        if existing == new_content:
            return False

    path.write_text(new_content, encoding="utf-8")
    return True

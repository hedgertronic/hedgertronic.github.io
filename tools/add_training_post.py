#!/usr/bin/env python3
"""Interactive helper for adding an Instagram training post entry.

Usage:
    uv run python tools/add_training_post.py <instagram_post_url>

Steps:
    1. Extracts the shortcode from the Instagram URL.
    2. Prompts for the path to a manually-downloaded cover image.
    3. Copies (and optionally compresses) the image to
       assets/images/instagram/<shortcode>.jpg — images over 300 KB are
       recompressed with Pillow at JPEG quality 80.
    4. Prints a ready-to-paste JSON entry template matching
       data/field-training.json's shape.

The script does NOT modify field-training.json itself.
"""

import json
import re
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
INSTAGRAM_DIR = PROJECT_ROOT / "assets" / "images" / "instagram"
TRAINING_FILE = PROJECT_ROOT / "data" / "field-training.json"
COMPRESS_THRESHOLD_BYTES = 300 * 1024  # 300 KB

SHORTCODE_RE = re.compile(r"instagram\.com/(?:p|reel)/([A-Za-z0-9_-]+)")


def extract_shortcode(url: str) -> str | None:
    """Extract the Instagram shortcode from a post or reel URL."""
    m = SHORTCODE_RE.search(url)
    return m.group(1) if m else None


def compress_image(src: Path, dest: Path) -> None:
    """Copy src to dest as JPEG, compressing if the source exceeds the threshold."""
    try:
        from PIL import Image
    except ImportError:
        print("WARNING: Pillow not installed; copying image without compression")
        shutil.copy2(src, dest)
        return

    src_size = src.stat().st_size
    if src_size <= COMPRESS_THRESHOLD_BYTES:
        shutil.copy2(src, dest)
        print(f"  Copied ({src_size // 1024} KB, no compression needed)")
        return

    img = Image.open(src)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(dest, format="JPEG", quality=80, optimize=True)
    dest_size = dest.stat().st_size
    print(
        f"  Compressed: {src_size // 1024} KB → {dest_size // 1024} KB "
        f"(saved {(src_size - dest_size) // 1024} KB)"
    )


def next_order() -> int:
    """Return the next order number based on the existing field-training.json."""
    if not TRAINING_FILE.exists():
        return 1
    try:
        import json as _json
        with open(TRAINING_FILE, encoding="utf-8") as f:
            entries = _json.load(f)
        orders = [e.get("order", 0) for e in entries if isinstance(e, dict)]
        return (max(orders) + 1) if orders else 1
    except Exception:
        return 1


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: uv run python tools/add_training_post.py <instagram_post_url>")
        sys.exit(1)

    post_url = sys.argv[1].strip()
    shortcode = extract_shortcode(post_url)
    if not shortcode:
        print(f"ERROR: Could not extract shortcode from URL: {post_url}")
        sys.exit(1)

    print(f"Shortcode: {shortcode}")

    # Prompt for image path
    try:
        image_input = input("Path to downloaded cover image (or press Enter to skip): ").strip()
    except (EOFError, KeyboardInterrupt):
        image_input = ""

    poster_path = f"assets/images/instagram/{shortcode}.jpg"

    if image_input:
        src = Path(image_input).expanduser()
        if not src.exists():
            print(f"WARNING: Image not found at {src}; skipping copy")
            image_input = ""
        else:
            INSTAGRAM_DIR.mkdir(parents=True, exist_ok=True)
            dest = INSTAGRAM_DIR / f"{shortcode}.jpg"
            compress_image(src, dest)
            print(f"  Saved to {dest.relative_to(PROJECT_ROOT)}")

    if not image_input:
        print(f"  Poster will be: {poster_path}  (copy image manually if needed)")

    # Gather metadata
    try:
        label = input("Label (e.g. 'Early Offseason'): ").strip()
        date = input("Date (YYYY-MM-DD): ").strip()
        credit_handle = input("Credit handle (Instagram username, no @): ").strip()
        caption = input("Caption (paste full text, end with Enter twice):\n").strip()
        # Allow multi-line caption by reading until blank line
        while True:
            try:
                line = input()
            except EOFError:
                break
            if line == "":
                break
            caption += "\n" + line
    except (EOFError, KeyboardInterrupt):
        label = label if "label" in dir() else ""
        date = date if "date" in dir() else ""
        credit_handle = credit_handle if "credit_handle" in dir() else ""
        caption = caption if "caption" in dir() else ""

    order = next_order()

    entry = {
        "type": "video",
        "label": label or "LABEL",
        "order": order,
        "poster": poster_path,
        "url": post_url,
        "credit": {
            "handle": credit_handle or "HANDLE",
            "url": f"https://www.instagram.com/{credit_handle}/" if credit_handle else "URL",
        },
        "date": date or "YYYY-MM-DD",
        "caption": caption or "CAPTION",
    }

    print("\n--- Paste this into data/field-training.json ---\n")
    print(json.dumps(entry, indent=2, ensure_ascii=False))
    print("\n--- (Do not forget to update the order fields if inserting mid-list) ---")


if __name__ == "__main__":
    main()

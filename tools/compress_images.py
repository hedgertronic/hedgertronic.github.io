#!/usr/bin/env python3
"""
Compress images to WebP format for faster web loading.

Converts JPG/JPEG/PNG images to WebP format, keeping originals alongside
the compressed versions. Use the <picture> element for browser fallbacks.

Usage:
    python tools/compress_images.py              # Compress all images
    python tools/compress_images.py --dry-run    # Preview without saving
    python tools/compress_images.py path/to/img  # Compress specific file

This script:
1. Recursively finds images in assets/images/
2. Converts to WebP format (typically 25-35% smaller)
3. Keeps original files intact
4. Skips already-compressed files and small optimized variants
5. Prints size comparison statistics
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


# Configuration
WEBP_QUALITY = 85  # Good balance of quality and file size
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
SKIP_PATTERNS = ["-sm"]  # Skip already-optimized small variants
SKIP_DIRECTORIES = ["favicons"]  # Skip directories that need specific formats


def get_project_root() -> Path:
    """Get the project root directory."""
    script_dir = Path(__file__).parent
    return script_dir.parent


def should_skip_file(filepath: Path) -> str | None:
    """
    Check if a file should be skipped.

    Returns:
        Reason string if should skip, None if should process
    """
    # Skip files in excluded directories
    for skip_dir in SKIP_DIRECTORIES:
        if skip_dir in filepath.parts:
            return f"in excluded directory ({skip_dir})"

    stem = filepath.stem.lower()

    # Skip optimized variants
    for pattern in SKIP_PATTERNS:
        if pattern in stem:
            return f"optimized variant ({pattern})"

    # Skip if WebP version already exists
    webp_path = filepath.with_suffix(".webp")
    if webp_path.exists():
        return "WebP version exists"

    return None


def compress_to_webp(source_path: Path, target_path: Path, quality: int) -> dict:
    """
    Compress an image to WebP format.

    Args:
        source_path: Path to the source image
        target_path: Path to save the WebP image
        quality: WebP quality (0-100)

    Returns:
        Dictionary with compression statistics
    """
    original_size = source_path.stat().st_size

    with Image.open(source_path) as img:
        original_dimensions = img.size

        # Preserve transparency for PNGs
        if img.mode in ("RGBA", "LA") or (
            img.mode == "P" and "transparency" in img.info
        ):
            # Keep alpha channel for WebP
            if img.mode == "P":
                img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Save as WebP
        img.save(target_path, "WEBP", quality=quality, method=6)  # method=6 is slowest but best compression

    new_size = target_path.stat().st_size

    return {
        "source": source_path.name,
        "target": target_path.name,
        "dimensions": original_dimensions,
        "original_size": original_size,
        "new_size": new_size,
        "reduction_percent": (1 - new_size / original_size) * 100,
    }


def format_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def find_images(root_dir: Path) -> list[Path]:
    """Find all compressible images in directory."""
    images = []
    for ext in SUPPORTED_EXTENSIONS:
        images.extend(root_dir.rglob(f"*{ext}"))
        images.extend(root_dir.rglob(f"*{ext.upper()}"))
    return sorted(set(images))


def main():
    parser = argparse.ArgumentParser(description="Compress images to WebP format")
    parser.add_argument(
        "path",
        nargs="?",
        help="Specific file or directory to compress (default: assets/images/)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be compressed without saving",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=WEBP_QUALITY,
        help=f"WebP quality 0-100 (default: {WEBP_QUALITY})",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing WebP files",
    )
    args = parser.parse_args()

    project_root = get_project_root()

    # Determine what to compress
    if args.path:
        target = Path(args.path)
        if not target.is_absolute():
            target = project_root / target
        if target.is_file():
            images = [target]
        elif target.is_dir():
            images = find_images(target)
        else:
            print(f"Error: Path not found: {target}")
            sys.exit(1)
    else:
        images_dir = project_root / "assets" / "images"
        if not images_dir.exists():
            print(f"Error: Images directory not found: {images_dir}")
            sys.exit(1)
        images = find_images(images_dir)

    if not images:
        print("No images found to compress.")
        return

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Compressing images to WebP (quality={args.quality})...\n")

    results = []
    skipped = []

    for source_path in images:
        # Check if we should skip
        if not args.force:
            skip_reason = should_skip_file(source_path)
            if skip_reason:
                skipped.append((source_path.name, skip_reason))
                continue

        target_path = source_path.with_suffix(".webp")
        rel_path = source_path.relative_to(project_root)

        if args.dry_run:
            print(f"  Would compress: {rel_path}")
            # Still calculate what the size would be for preview
            try:
                original_size = source_path.stat().st_size
                results.append({
                    "source": source_path.name,
                    "original_size": original_size,
                    "new_size": int(original_size * 0.7),  # Estimate ~30% reduction
                    "reduction_percent": 30.0,
                })
            except Exception:
                pass
            continue

        try:
            result = compress_to_webp(source_path, target_path, args.quality)
            results.append(result)

            print(f"  {rel_path}")
            print(f"    {format_size(result['original_size'])} -> {format_size(result['new_size'])} ({result['reduction_percent']:.1f}% smaller)")
        except Exception as e:
            print(f"  Error: {rel_path}: {e}")

    # Summary
    print()
    if skipped:
        print(f"Skipped {len(skipped)} files:")
        for name, reason in skipped[:5]:
            print(f"  - {name}: {reason}")
        if len(skipped) > 5:
            print(f"  ... and {len(skipped) - 5} more")
        print()

    if results:
        total_original = sum(r["original_size"] for r in results)
        total_new = sum(r["new_size"] for r in results)
        total_reduction = (1 - total_new / total_original) * 100

        print("=" * 50)
        action = "Would save" if args.dry_run else "Saved"
        print(f"{action}: {format_size(total_original - total_new)} ({total_reduction:.1f}% reduction)")
        print(f"Compressed {len(results)} images")

        if not args.dry_run:
            print("\nNext step: Update HTML to use <picture> elements:")
            print('  <picture>')
            print('    <source srcset="image.webp" type="image/webp">')
            print('    <img src="image.jpg" alt="description">')
            print('  </picture>')


if __name__ == "__main__":
    main()

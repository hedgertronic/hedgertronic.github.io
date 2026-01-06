#!/usr/bin/env python3
"""
Optimize headshot images for web display.

Resizes large headshot images to appropriate dimensions for their actual
display size (200x200 for 2x retina of 100px hero display), significantly
reducing file size while maintaining visual quality.

Usage:
    python tools/optimize_headshots.py

This script:
1. Reads source images from assets/images/headshot/
2. Resizes to 200x200 pixels (2x retina for 100px display)
3. Saves optimized versions with '-sm' suffix
4. Preserves original file modification times
5. Prints size comparison statistics
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip install Pillow")
    sys.exit(1)


# Configuration
TARGET_SIZE = 200  # 2x retina for 100px max display size
JPEG_QUALITY = 85  # Good balance of quality and file size
IMAGES_TO_OPTIMIZE = [
    "headshot-dl.jpg",
    "headshot-mets.jpg",
    "headshot-phillies.jpg",
]


def get_project_root() -> Path:
    """Get the project root directory."""
    script_dir = Path(__file__).parent
    return script_dir.parent


def optimize_image(source_path: Path, target_path: Path, size: int) -> dict:
    """
    Resize an image to the target size and save it.

    Args:
        source_path: Path to the source image
        target_path: Path to save the optimized image
        size: Target width and height in pixels

    Returns:
        Dictionary with optimization statistics
    """
    # Get original file stats
    original_stat = source_path.stat()
    original_size = original_stat.st_size

    # Open and resize the image
    with Image.open(source_path) as img:
        original_dimensions = img.size

        # Convert to RGB if necessary (handles RGBA PNGs, etc.)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # Resize with high-quality resampling
        img_resized = img.resize((size, size), Image.Resampling.LANCZOS)

        # Save with optimized settings
        img_resized.save(
            target_path,
            "JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=True,
        )

    # Preserve original file times (access time, modification time)
    os.utime(target_path, (original_stat.st_atime, original_stat.st_mtime))

    # Get new file size
    new_size = target_path.stat().st_size

    return {
        "source": source_path.name,
        "target": target_path.name,
        "original_dimensions": original_dimensions,
        "new_dimensions": (size, size),
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


def main():
    project_root = get_project_root()
    headshot_dir = project_root / "assets" / "images" / "headshot"

    if not headshot_dir.exists():
        print(f"Error: Headshot directory not found: {headshot_dir}")
        sys.exit(1)

    print(f"Optimizing headshots to {TARGET_SIZE}x{TARGET_SIZE}px...")
    print(f"Target directory: {headshot_dir}\n")

    results = []

    for filename in IMAGES_TO_OPTIMIZE:
        source_path = headshot_dir / filename

        if not source_path.exists():
            print(f"Warning: Source file not found: {source_path}")
            continue

        # Create target filename with -sm suffix
        stem = source_path.stem
        target_filename = f"{stem}-sm.jpg"
        target_path = headshot_dir / target_filename

        try:
            result = optimize_image(source_path, target_path, TARGET_SIZE)
            results.append(result)
            print(f"✓ {result['source']}")
            print(f"  {result['original_dimensions'][0]}x{result['original_dimensions'][1]} → {TARGET_SIZE}x{TARGET_SIZE}")
            print(f"  {format_size(result['original_size'])} → {format_size(result['new_size'])} ({result['reduction_percent']:.1f}% smaller)")
            print()
        except Exception as e:
            print(f"✗ Error processing {filename}: {e}")

    if results:
        total_original = sum(r["original_size"] for r in results)
        total_new = sum(r["new_size"] for r in results)
        total_reduction = (1 - total_new / total_original) * 100

        print("=" * 50)
        print(f"Total: {format_size(total_original)} → {format_size(total_new)} ({total_reduction:.1f}% smaller)")
        print("\nNext step: Update data/site.json to use the '-sm' versions")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Favicon generation tool for hedgertronic.github.io

Usage:
    # Create circular image from square photo
    uv run --with pillow tools/generate_favicon.py circle assets/images/headshot/headshot.jpg -o circular.png

    # Generate all favicons from a circular image
    uv run --with pillow tools/generate_favicon.py favicons circular.png -o assets/images/favicons/

    # Do both in one go (convenience command)
    uv run --with pillow tools/generate_favicon.py all assets/images/headshot/headshot.jpg -o assets/images/favicons/
"""

import argparse
from pathlib import Path


def create_circular_image(input_path: Path, output_path: Path) -> None:
    """
    Take a square image and crop it into a circle with transparent background.

    Args:
        input_path: Path to the source image (should be square for best results)
        output_path: Path to save the circular PNG with transparency
    """
    from PIL import Image, ImageDraw

    img = Image.open(input_path).convert("RGBA")

    # Use the smaller dimension to ensure we get a proper circle
    size = min(img.size)

    # Center crop if not square
    if img.size[0] != img.size[1]:
        left = (img.size[0] - size) // 2
        top = (img.size[1] - size) // 2
        img = img.crop((left, top, left + size, top + size))

    # Create circular mask (white = visible, black = transparent)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    # Apply mask to create transparent background
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(img, (0, 0), mask)

    output.save(output_path, "PNG")
    print(f"Created circular image: {output_path} ({size}x{size})")


def generate_favicons(input_path: Path, output_dir: Path) -> None:
    """
    Generate all favicon sizes from a source image.

    Creates:
        - favicon.ico (multi-size: 16x16, 32x32)
        - favicon-16.png
        - favicon-32.png
        - favicon-180.png
        - apple-touch-icon.png (180x180)

    Args:
        input_path: Path to source image (ideally already circular with transparency)
        output_dir: Directory to save favicon files
    """
    from PIL import Image

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(input_path).convert("RGBA")

    # Define sizes to generate
    png_sizes = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "favicon-180.png": 180,
        "apple-touch-icon.png": 180,
    }

    # Generate PNG favicons (with transparency)
    for filename, size in png_sizes.items():
        resized = img.resize((size, size), Image.LANCZOS)
        output_path = output_dir / filename
        resized.save(output_path, "PNG")
        print(f"Created {output_path} ({size}x{size})")

    # Generate ICO file (needs RGB with white background for Safari compatibility)
    # But we'll try RGBA first since it worked
    img_32 = img.resize((32, 32), Image.LANCZOS)
    img_16 = img.resize((16, 16), Image.LANCZOS)

    ico_path = output_dir / "favicon.ico"
    img_32.save(ico_path, format="ICO", append_images=[img_16])
    print(f"Created {ico_path} (16x16 + 32x32 embedded)")


def generate_all(input_path: Path, output_dir: Path) -> None:
    """
    Convenience function: create circular image and generate all favicons in one step.

    Args:
        input_path: Path to source headshot image
        output_dir: Directory to save favicon files
    """
    from PIL import Image
    import io

    # Create circular image in memory (no intermediate file needed)
    from PIL import ImageDraw

    img = Image.open(input_path).convert("RGBA")
    size = min(img.size)

    # Center crop if not square
    if img.size[0] != img.size[1]:
        left = (img.size[0] - size) // 2
        top = (img.size[1] - size) // 2
        img = img.crop((left, top, left + size, top + size))

    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)

    # Apply mask
    circular = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular.paste(img, (0, 0), mask)

    print(f"Created circular image from {input_path} ({size}x{size})")

    # Now generate favicons from circular image
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    png_sizes = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "favicon-180.png": 180,
        "apple-touch-icon.png": 180,
    }

    for filename, sz in png_sizes.items():
        resized = circular.resize((sz, sz), Image.LANCZOS)
        output_path = output_dir / filename
        resized.save(output_path, "PNG")
        print(f"Created {output_path} ({sz}x{sz})")

    # ICO file
    img_32 = circular.resize((32, 32), Image.LANCZOS)
    img_16 = circular.resize((16, 16), Image.LANCZOS)
    ico_path = output_dir / "favicon.ico"
    img_32.save(ico_path, format="ICO", append_images=[img_16])
    print(f"Created {ico_path} (16x16 + 32x32 embedded)")

    print(f"\nDone! Don't forget to bump the cache version (?v=X) in your HTML if updating existing favicons.")


def main():
    parser = argparse.ArgumentParser(
        description="Generate favicons from a headshot image",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Subcommand: circle
    circle_parser = subparsers.add_parser(
        "circle",
        help="Create a circular image with transparent background"
    )
    circle_parser.add_argument("input", type=Path, help="Input image path")
    circle_parser.add_argument(
        "-o", "--output",
        type=Path,
        default=Path("circular.png"),
        help="Output path (default: circular.png)"
    )

    # Subcommand: favicons
    favicons_parser = subparsers.add_parser(
        "favicons",
        help="Generate all favicon sizes from an image"
    )
    favicons_parser.add_argument("input", type=Path, help="Input image path")
    favicons_parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("assets/images/favicons"),
        help="Output directory (default: assets/images/favicons)"
    )

    # Subcommand: all
    all_parser = subparsers.add_parser(
        "all",
        help="Create circular image and generate all favicons in one step"
    )
    all_parser.add_argument("input", type=Path, help="Input headshot image path")
    all_parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("assets/images/favicons"),
        help="Output directory (default: assets/images/favicons)"
    )

    args = parser.parse_args()

    if args.command == "circle":
        create_circular_image(args.input, args.output)
    elif args.command == "favicons":
        generate_favicons(args.input, args.output_dir)
    elif args.command == "all":
        generate_all(args.input, args.output_dir)


if __name__ == "__main__":
    main()

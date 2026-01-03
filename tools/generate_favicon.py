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


def generate_text_favicon(text: str, font_path: Path, output_dir: Path, bg_color: str = "#0a0e1a", text_color: str = "#ffffff", corner_radius: float = 0.2, stroke_width: float = 0.0) -> None:
    """
    Generate a text-based favicon using a specified font.

    Args:
        text: The text to render (e.g., "JH")
        font_path: Path to the TTF font file
        bg_color: Background color (hex)
        text_color: Text color (hex)
        output_dir: Directory to save favicon files
        corner_radius: Corner radius as a fraction of size (0.0 = square, 0.5 = circle)
        stroke_width: Stroke width as fraction of font size to simulate bold (0.0 = none)
    """
    from PIL import Image, ImageDraw, ImageFont

    # Convert hex colors to RGB tuples
    def hex_to_rgb(hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    bg_rgb = hex_to_rgb(bg_color)
    text_rgb = hex_to_rgb(text_color)

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Create a large canvas first (512x512) for better quality
    size = 512
    radius = int(size * corner_radius)

    # Create transparent canvas and draw rounded rectangle
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded rectangle background
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=(*bg_rgb, 255)
    )

    # Load font at a size that fills most of the canvas
    font_size = int(size * 0.65)
    font = ImageFont.truetype(str(font_path), font_size)

    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Center the text (adjust for baseline)
    x = (size - text_width) // 2 - bbox[0]
    y = (size - text_height) // 2 - bbox[1]

    # Calculate stroke in pixels (fraction of font size)
    stroke_px = int(font_size * stroke_width) if stroke_width > 0 else 0

    # Draw the text with optional stroke for faux-bold effect
    draw.text(
        (x, y),
        text,
        font=font,
        fill=(*text_rgb, 255),
        stroke_width=stroke_px,
        stroke_fill=(*text_rgb, 255)
    )

    bold_info = f", stroke={stroke_px}px" if stroke_px > 0 else ""
    print(f"Created text favicon base image with '{text}' ({size}x{size}, radius={radius}px{bold_info})")

    # Generate all favicon sizes
    png_sizes = {
        "favicon-16.png": 16,
        "favicon-32.png": 32,
        "favicon-180.png": 180,
        "apple-touch-icon.png": 180,
    }

    for filename, sz in png_sizes.items():
        resized = img.resize((sz, sz), Image.LANCZOS)
        output_path = output_dir / filename
        resized.save(output_path, "PNG")
        print(f"Created {output_path} ({sz}x{sz})")

    # ICO file
    img_32 = img.resize((32, 32), Image.LANCZOS)
    img_16 = img.resize((16, 16), Image.LANCZOS)
    ico_path = output_dir / "favicon.ico"
    img_32.save(ico_path, format="ICO", append_images=[img_16])
    print(f"Created {ico_path} (16x16 + 32x32 embedded)")

    print(f"\nDone! Don't forget to bump the cache version (?v=X) in your HTML if updating existing favicons.")


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

    # Subcommand: text
    text_parser = subparsers.add_parser(
        "text",
        help="Generate a text-based favicon using a specified font"
    )
    text_parser.add_argument("text", type=str, help="Text to render (e.g., 'JH')")
    text_parser.add_argument("font", type=Path, help="Path to TTF font file")
    text_parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("assets/images/favicons"),
        help="Output directory (default: assets/images/favicons)"
    )
    text_parser.add_argument(
        "--bg-color",
        type=str,
        default="#0a0e1a",
        help="Background color in hex (default: #0a0e1a)"
    )
    text_parser.add_argument(
        "--text-color",
        type=str,
        default="#ffffff",
        help="Text color in hex (default: #ffffff)"
    )
    text_parser.add_argument(
        "--radius",
        type=float,
        default=0.2,
        help="Corner radius as fraction of size, 0.0=square, 0.5=circle (default: 0.2)"
    )
    text_parser.add_argument(
        "--bold",
        type=float,
        default=0.0,
        help="Faux-bold stroke width as fraction of font size (default: 0.0, try 0.03-0.05)"
    )

    args = parser.parse_args()

    if args.command == "circle":
        create_circular_image(args.input, args.output)
    elif args.command == "favicons":
        generate_favicons(args.input, args.output_dir)
    elif args.command == "all":
        generate_all(args.input, args.output_dir)
    elif args.command == "text":
        generate_text_favicon(args.text, args.font, args.output_dir, args.bg_color, args.text_color, args.radius, args.bold)


if __name__ == "__main__":
    main()

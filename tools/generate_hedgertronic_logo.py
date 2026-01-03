#!/usr/bin/env python3
"""
Generate a hedgertronic camera logo inspired by the Edgertronic high-speed camera.
Creates an Instagram-style simplified icon with the camera body and lens.
"""

from pathlib import Path


def generate_hedgertronic_logo(output_dir: Path, bg_color: str = "#FFA300", body_color: str = "#0a0a0a", simplified: bool = False) -> None:
    """
    Generate hedgertronic camera logo as favicon.

    The design is a simplified front view of the Edgertronic camera:
    - Rounded square body (like Instagram icon style)
    - Large circular lens on the right
    - Small indicator/screw on the left
    - "hedgertronic" text at bottom
    """
    from PIL import Image, ImageDraw, ImageFont

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    def hex_to_rgb(hex_color):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    bg_rgb = hex_to_rgb(bg_color)
    body_rgb = hex_to_rgb(body_color)

    # Create large canvas for quality
    size = 512
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle body (Instagram-style rounded corners)
    margin = 20
    corner_radius = 90
    draw.rounded_rectangle(
        [(margin, margin), (size - margin, size - margin)],
        radius=corner_radius,
        fill=(*bg_rgb, 255)
    )

    # Main lens position (same for both versions)
    lens_radius = 145
    lens_margin = margin + lens_radius + 30
    lens_center_x = size - lens_margin
    lens_center_y = lens_margin

    # Lens outer ring (dark)
    draw.ellipse(
        [
            lens_center_x - lens_radius,
            lens_center_y - lens_radius,
            lens_center_x + lens_radius,
            lens_center_y + lens_radius
        ],
        fill=(*body_rgb, 255)
    )

    # Lens inner ring
    inner_radius = 115
    draw.ellipse(
        [
            lens_center_x - inner_radius,
            lens_center_y - inner_radius,
            lens_center_x + inner_radius,
            lens_center_y + inner_radius
        ],
        fill=(40, 40, 45, 255)
    )

    # Lens glass
    glass_radius = 85
    draw.ellipse(
        [
            lens_center_x - glass_radius,
            lens_center_y - glass_radius,
            lens_center_x + glass_radius,
            lens_center_y + glass_radius
        ],
        fill=(25, 25, 30, 255)
    )

    # Lens highlight/reflection (small bright spot) - on both versions
    highlight_radius = 20
    highlight_x = lens_center_x - 30
    highlight_y = lens_center_y - 35
    draw.ellipse(
        [
            highlight_x - highlight_radius,
            highlight_y - highlight_radius,
            highlight_x + highlight_radius,
            highlight_y + highlight_radius
        ],
        fill=(60, 60, 70, 255)
    )

    if not simplified:
        # Full version additions: dot and text

        # Small indicator dot on the left (like the screw on the real camera)
        indicator_radius = 18
        indicator_x = margin + 65
        indicator_y = size // 2 - 60
        draw.ellipse(
            [
                indicator_x - indicator_radius,
                indicator_y - indicator_radius,
                indicator_x + indicator_radius,
                indicator_y + indicator_radius
            ],
            fill=(*body_rgb, 255)
        )

        # "hedgertronic" text at bottom (centered)
        try:
            # Try to use Inter
            ttf_path = Path(__file__).parent.parent / "assets/fonts/Inter-Regular.ttf"
            if ttf_path.exists():
                font = ImageFont.truetype(str(ttf_path), 36)
            else:
                # Fallback to system sans
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        except:
            font = ImageFont.load_default()

        text = "hedgertronic"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_x = (size - text_width) // 2  # Centered
        text_y = size - margin - 55
        draw.text((text_x, text_y), text, font=font, fill=(*body_rgb, 255))

    print(f"Created hedgertronic logo ({size}x{size})")

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

    # Also save a large preview version
    preview_path = output_dir / "hedgertronic-logo-preview.png"
    img.save(preview_path, "PNG")
    print(f"Created {preview_path} for preview")

    print("\nDone! Check hedgertronic-logo-preview.png to see the full-size version.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate hedgertronic camera logo")
    parser.add_argument(
        "-o", "--output-dir",
        type=Path,
        default=Path("assets/images/favicons"),
        help="Output directory (default: assets/images/favicons)"
    )
    parser.add_argument(
        "--bg-color",
        type=str,
        default="#FFA300",
        help="Background/body color in hex (default: #FFA300 - Driveline orange)"
    )
    parser.add_argument(
        "--text-color",
        type=str,
        default="#0a0a0a",
        help="Text and lens color in hex (default: #0a0a0a)"
    )
    parser.add_argument(
        "--simplified",
        action="store_true",
        help="Generate simplified version (centered lens only, no text/dot)"
    )

    args = parser.parse_args()
    generate_hedgertronic_logo(args.output_dir, args.bg_color, args.text_color, args.simplified)

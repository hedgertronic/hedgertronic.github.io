#!/usr/bin/env python3
"""
Generate Open Graph image from site data.

Uses Playwright to render an HTML template and screenshot it.
The resulting image matches the site's hero section styling.

Usage:
    pip install playwright
    playwright install chromium
    python generate_og_image.py

Output:
    assets/images/og-image.png (1200x630)
"""

import json
from pathlib import Path

def main():
    # Import here so we get a clear error if not installed
    from playwright.sync_api import sync_playwright

    # Paths
    root = Path(__file__).parent.parent
    template_path = Path(__file__).parent / "og-template.html"
    output_path = root / "assets" / "images" / "og" / "og-image.png"
    site_json_path = root / "data" / "site.json"

    # Load site data
    with open(site_json_path, "r") as f:
        site_data = json.load(f)

    profile = site_data["profile"]
    name = profile["name"]
    bio = profile["bio"]
    # Convert headshot path to absolute file:// URL
    headshot_rel = profile["headshot"].lstrip("/")
    headshot_abs = (root / headshot_rel).resolve()

    # Read and populate template
    with open(template_path, "r") as f:
        html = f.read()

    html = html.replace("{{NAME}}", name)
    html = html.replace("{{BIO}}", bio)
    html = html.replace("{{HEADSHOT}}", f"file://{headshot_abs}")

    # Write temporary HTML file (Playwright needs a file to load fonts properly)
    temp_html = Path(__file__).parent / "og-temp.html"
    with open(temp_html, "w") as f:
        f.write(html)

    # Generate screenshot
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.goto(f"file://{temp_html.resolve()}")
        # Wait for fonts to load
        page.wait_for_timeout(500)
        page.screenshot(path=str(output_path))
        browser.close()

    # Clean up temp file
    temp_html.unlink()

    print(f"Generated: {output_path}")


if __name__ == "__main__":
    main()

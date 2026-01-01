#!/usr/bin/env python3
"""Convert pasted tweet text to JSON-safe string with escaped newlines."""

import json

print("Paste your tweet text below. Press Ctrl+D (Mac/Linux) or Ctrl+Z (Windows) when done:\n")

try:
    lines = []
    while True:
        try:
            line = input()
            lines.append(line)
        except EOFError:
            break

    text = "\n".join(lines)

    # Use json.dumps to properly escape the string
    json_safe = json.dumps(text)

    print("\n" + "=" * 50)
    print("JSON-safe string (copy everything between the quotes):")
    print("=" * 50)
    print(json_safe)
    print("=" * 50)

except KeyboardInterrupt:
    print("\nCancelled.")

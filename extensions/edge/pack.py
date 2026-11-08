#!/usr/bin/env python3
"""Build the Edge submission zip. Listing notes and store images stay out of the package."""

from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent
ZIP_NAME = "hisab-age-calculator-edge-1.0.0.zip"
FILES = [
    "manifest.json",
    "popup.html",
    "popup.css",
    "popup.js",
    "js/age.js",
    "icons/icon16.png",
    "icons/icon48.png",
    "icons/icon128.png",
]


def main() -> None:
    destination = ROOT / ZIP_NAME
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in FILES:
            path = ROOT / name
            if not path.is_file():
                raise SystemExit(f"missing {name}")
            archive.write(path, name)
    print(destination)


if __name__ == "__main__":
    main()

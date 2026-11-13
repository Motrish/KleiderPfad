#!/usr/bin/env python3
"""Render every original Kleidolino SVG to PNG and WebP. Never edits SVG masters."""
from pathlib import Path
import xml.etree.ElementTree as ET
from io import BytesIO

try:
    import cairosvg
    from PIL import Image
except ImportError as e:
    raise SystemExit("Install dependencies: python -m pip install cairosvg pillow") from e

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets"
OUTPUT = ROOT / "raster"

def render(path: Path):
    root = ET.parse(path).getroot()  # Validate XML before rendering
    viewbox = root.attrib.get("viewBox", "")
    parts = viewbox.replace(",", " ").split()
    if len(parts) != 4:
        raise ValueError(f"{path}: missing valid viewBox")
    base_width = int(float(parts[2]))
    # App icons need high resolution, print formats need higher DPI.
    category = path.relative_to(SOURCE).parts[0]
    if category == "print":
        out_width = max(900, int(base_width * 1.25))
    elif category in ("logos", "icons"):
        out_width = max(512, min(2400, base_width * 2))
    elif category in ("mockups", "ui", "illustrations", "patterns"):
        out_width = max(780, min(2000, base_width * 1.5))
    else:
        out_width = base_width
    data = cairosvg.svg2png(url=str(path), output_width=out_width)
    relative = path.relative_to(SOURCE)
    output_path = (OUTPUT / relative).with_suffix(".png")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(data)
    img = Image.open(BytesIO(data)).convert("RGBA")
    img.save(output_path.with_suffix(".webp"), format="WEBP", quality=88, method=6)
    print(f"{relative} → {img.width}×{img.height} PNG+WebP")

def main():
    svgs = sorted(SOURCE.rglob("*.svg"))
    if not svgs:
        raise SystemExit("No SVG source files found")
    for path in svgs:
        render(path)
    print(f"Rendered {len(svgs)} SVG masters into PNG and WebP files.")

if __name__ == "__main__":
    main()

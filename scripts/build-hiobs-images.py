"""HIOBS social cards: match the approved ROLEX typographic composition.
Only the background/text color pair, subject, and system label vary.
All palettes are read from unchanged styles.css. Published ROLEX PNG is preserved.
Usage: python3 scripts/build-hiobs-images.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, re

ROOT = Path(__file__).resolve().parents[1]
CSS = (ROOT / "styles.css").read_text(encoding="utf-8")
MANIFEST = json.loads((ROOT / "scripts/hiobs-distribution-manifest.json").read_text(encoding="utf-8"))
SIZE = (1200, 630)
SCALE = 2
FONTS = {
    "regular": [
        "/usr/share/fonts/truetype/lato/Lato-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    ],
    "heavy": [
        "/usr/share/fonts/truetype/lato/Lato-Heavy.ttf",
        "/usr/share/fonts/truetype/lato/Lato-Black.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    ]
}
def css_color(name):
    found = re.search(r"--" + re.escape(name) + r":\s*(#[0-9a-fA-F]{6})\s*;", CSS)
    if not found:
        raise ValueError("Missing website palette entry: " + name)
    return found.group(1)

def choose_font(style, pt):
    for name in FONTS[style]:
        if Path(name).is_file():
            return ImageFont.truetype(name, int(pt*SCALE))
    raise RuntimeError("Cannot locate font for " + style)

def text_width(draw, text, font, tracking):
    return draw.textlength(text, font=font) + max(0, len(text)-1)*tracking*SCALE

def draw_tracked(draw, text, x, y, font, tracking, ink):
    pen = x*SCALE
    for ch in text:
        draw.text((round(pen), y*SCALE), ch, fill=ink, font=font)
        pen += draw.textlength(ch, font=font) + tracking*SCALE

def fitted(draw, text, x, y, preferred_pt, min_pt, max_width, tracking, style, ink):
    # The precise ROLEX sizing is retained where there is room.
    for pt in range(preferred_pt, min_pt-1, -1):
        font = choose_font(style, pt)
        if text_width(draw, text, font, tracking) <= max_width*SCALE:
            draw_tracked(draw, text, x, y, font, tracking, ink)
            return pt
    raise ValueError("Social card subject too long to fit: " + text)

def run():
    assert MANIFEST["observationCount"] == 144
    output_count = 0
    for item in MANIFEST["entries"]:
        subject, system = item["subject"], item["system"]
        path = ROOT / item["imagePath"]
        if (subject, system) == ("ROLEX", "immune"):
            assert path.is_file(), "Published ROLEX Immune preview must remain intact"
            continue
        ink, bg = css_color(system + "-text"), css_color(system + "-bg")
        canvas = Image.new("RGB", (SIZE[0]*SCALE, SIZE[1]*SCALE), bg)
        draw = ImageDraw.Draw(canvas)
        draw_tracked(draw, "HUMAN INC. OBSERVATIONS", 78, 69,
                     choose_font("regular", 24), 1.5, ink)
        fitted(draw, subject.upper(), 78, 223, 88, 34, 1020, 1, "heavy", ink)
        fitted(draw, system.upper(), 78, 336, 46, 28, 1020, 2.5, "regular", ink)
        draw_tracked(draw, "HUMANINCPRACTICE.COM", 78, 529,
                     choose_font("regular", 24), 1.2, ink)
        path.parent.mkdir(parents=True, exist_ok=True)
        canvas.resize(SIZE, Image.Resampling.LANCZOS).quantize(
            colors=16, method=Image.Quantize.FASTOCTREE
        ).save(path, optimize=True, compress_level=9)
        with Image.open(path) as verification:
            assert verification.format == "PNG" and verification.size == SIZE
        output_count += 1
    assert output_count == 143
    print("Generated exactly 143 social preview images; published ROLEX unchanged")

if __name__ == "__main__":
    run()

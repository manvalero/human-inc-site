"""Generate only ROLEX / Immune Open Graph PNG.
Approved minimalist layout; no illustrations, logos, or body changes.
Uses the published Immune card CSS palette, without a second colors source.
Run: python3 scripts/build-rolex-immune-og.py (requires Pillow).
"""
from pathlib import Path
import re
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
css = (root / "styles.css").read_text(encoding="utf-8")
def css_color(name):
    match = re.search(r"--" + re.escape(name) + r":\\s*(#[0-9a-fA-F]{6})\\s*;", css)
    if not match:
        raise ValueError(f"Missing system palette variable: {name}")
    return match.group(1)

bg = css_color("immune-bg")
ink = css_color("immune-text")
assert (bg.lower(), ink.lower()) == ("#fdfdfd", "#4d7888")
size = (1200, 630)
scale = 2
canvas = Image.new("RGB", (size[0] * scale, size[1] * scale), bg)
draw = ImageDraw.Draw(canvas)
fonts = {
    "regular": ["/usr/share/fonts/truetype/lato/Lato-Bold.ttf",
                "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "heavy": ["/usr/share/fonts/truetype/lato/Lato-Heavy.ttf",
              "/usr/share/fonts/truetype/lato/Lato-Black.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
}
def font(style, pts):
    for filepath in fonts[style]:
        if Path(filepath).is_file():
            return ImageFont.truetype(filepath, pts * scale)
    raise RuntimeError("No supported font on build system")
def spaced(label, x, y, pts, spacing, style):
    active = font(style, pts)
    pen = x * scale
    for char in label:
        draw.text((round(pen), y * scale), char, fill=ink, font=active)
        pen += draw.textlength(char, font=active) + spacing * scale

spaced("HUMAN INC. OBSERVATIONS", 78, 69, 24, 1.5, "regular")
spaced("ROLEX", 78, 223, 88, 1, "heavy")
spaced("IMMUNE", 78, 336, 46, 2.5, "regular")
spaced("HUMANINCPRACTICE.COM", 78, 529, 24, 1.2, "regular")

output = root / "observations" / "assets" / "rolex-immune-og.png"
output.parent.mkdir(parents=True, exist_ok=True)
canvas.resize(size, Image.Resampling.LANCZOS).quantize(
    colors=16, method=Image.Quantize.FASTOCTREE
).save(output, optimize=True, compress_level=9)
with Image.open(output) as check:
    assert check.size == size and check.format == "PNG"
print("Generated", output.relative_to(root), output.stat().st_size, "bytes")

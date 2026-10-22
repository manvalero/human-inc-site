"""Generate the HIOBS-faithful 1200 × 630 ROLEX Immune Open Graph image.
Colors and typography follow the existing HIOBS Immune card.
Run: python scripts/build-rolex-immune-image.py (Pillow required).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
output = root / "observations" / "assets" / "rolex-immune-og.png"
output.parent.mkdir(parents=True, exist_ok=True)
image = Image.new("RGB", (1200, 630), "#fdfdfd")
draw = ImageDraw.Draw(image)
ink = "#4d7888"

font_candidates = {
    "sans": ["/usr/share/fonts/truetype/lato/Lato-Regular.ttf", "C:/Windows/Fonts/arial.ttf", "/Library/Fonts/Arial.ttf"],
    "bold": ["/usr/share/fonts/truetype/lato/Lato-Semibold.ttf", "C:/Windows/Fonts/arialbd.ttf", "/Library/Fonts/Arial Bold.ttf"],
    "serif": ["/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf", "C:/Windows/Fonts/georgia.ttf", "/Library/Fonts/Georgia.ttf"],
}
def font(family, size):
    for filename in font_candidates[family]:
        if Path(filename).exists():
            return ImageFont.truetype(filename, size)
    return ImageFont.load_default(size=size)

def spaced(label, x, y, text_font, spacing):
    for letter in label:
        draw.text((x, y), letter, fill=ink, font=text_font)
        x += draw.textlength(letter, font=text_font) + spacing

spaced("HUMAN INC. OBSERVATIONS", 78, 65, font("sans", 27), 2.4)
draw.text((76, 220), "ROLEX", fill=ink, font=font("serif", 135))
spaced("IMMUNE", 82, 399, font("bold", 38), 4)
draw.line((82, 522, 1118, 522), fill="#cddce1", width=2)
spaced("HUMANINCPRACTICE.COM", 82, 548, font("bold", 24), 2)
image.quantize(colors=16).save(output, optimize=True)
print(f"Generated {output}")

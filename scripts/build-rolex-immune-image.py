"""Reproduce the approved prototype Open Graph PNG (1200 × 630).
Install Pillow locally if needed: python -m pip install pillow
Run from repository root: python scripts/build-rolex-immune-image.py
This script changes no canonical observation content.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
output = root / "observations" / "assets" / "rolex-immune-og.png"
output.parent.mkdir(parents=True, exist_ok=True)
image = Image.new("RGB", (1200, 630), "#fdfdfd")
draw = ImageDraw.Draw(image)
ink = "#4d7888"
# Prefer common system fonts; explicit fallbacks keep the generator portable.
candidates = {
    "sans": ["/usr/share/fonts/truetype/lato/Lato-Regular.ttf", "C:/Windows/Fonts/arial.ttf", "/Library/Fonts/Arial.ttf"],
    "bold": ["/usr/share/fonts/truetype/lato/Lato-Semibold.ttf", "C:/Windows/Fonts/arialbd.ttf", "/Library/Fonts/Arial Bold.ttf"],
    "serif": ["/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf", "C:/Windows/Fonts/georgia.ttf", "/Library/Fonts/Georgia.ttf"],
}
def font(name, size):
    for filename in candidates[name]:
        if Path(filename).exists():
            return ImageFont.truetype(filename, size)
    return ImageFont.load_default(size=size)

def spaced(text, x, y, size, spacing, family="bold"):
    f = font(family, size)
    for letter in text:
        draw.text((x, y), letter, fill=ink, font=f)
        x += draw.textlength(letter, font=f) + spacing

spaced("HUMAN INC. OBSERVATIONS", 86, 65, 26, 2)
draw.text((86, 225), "ROLEX", fill=ink, font=font("serif", 128))
spaced("IMMUNE SYSTEM", 86, 389, 39, 4)
draw.line((86, 526, 1114, 526), fill="#cad7dc", width=2)
spaced("HUMANINCPRACTICE.COM", 86, 550, 25, 2)
image.quantize(colors=16).save(output, optimize=True)
print(f"Generated {output}")

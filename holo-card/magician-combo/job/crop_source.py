"""Crop renders/hero.png down to the card face -> source.png."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "renders" / "hero.png"
DST = ROOT / "source.png"

img = Image.open(SRC).convert("RGB")
w, h = img.size
px = img.load()

# Background is dark navy (~#16202e). Card face is bright with a light border.
# Scan a horizontal line through the vertical middle and a vertical line
# through the horizontal middle for the first "bright" run from each side.
def bright(p):
    return (p[0] + p[1] + p[2]) / 3 > 70

cy, cx = h // 2, w // 2
left = next(x for x in range(w) if bright(px[x, cy]))
right = next(x for x in range(w - 1, -1, -1) if bright(px[x, cy]))
top = next(y for y in range(h) if bright(px[cx, y]))
bottom = next(y for y in range(h - 1, -1, -1) if bright(px[cx, y]))

# Step in 2px to confirm we found the card edge, not glow speckle; print raw box
print("raw bbox:", left, top, right, bottom, "size:", right - left + 1, bottom - top + 1)

crop = img.crop((left, top, right + 1, bottom + 1))
print("cropped size:", crop.size, "ratio:", crop.size[0] / crop.size[1])
crop.save(DST)
print("saved:", DST)

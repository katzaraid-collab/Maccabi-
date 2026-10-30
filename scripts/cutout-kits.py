#!/usr/bin/env python3
"""Cut the four 26/27 men's match shirts out of their white packshots.

Usage:  python3 -I scripts/cutout-kits.py
Writes: public/kits/{home,away,third,fourth}.webp  (alpha, ~900px tall)

The background is removed by flood filling the near-white region that touches
the image border (so white areas *inside* the shirt, like the third kit's body,
survive), then the edge is eroded a pixel, feathered, and de-contaminated from
white so the cut-out has no halo on dark backgrounds. Run once; commit output.
"""

import io
import json
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "kits"
SNAPSHOT = ROOT / "data" / "catalog.snapshot.json"

KITS = {"home": "בית", "away": "חוץ", "third": "שלישית", "fourth": "רביעית"}
TOLERANCE = 18   # a pixel is "background" if every channel is >= 255 - TOLERANCE
SIZE = 900       # longest side of the output
PAD = 0.04       # transparent breathing room around the shirt


def find_image(products, word):
    rx = re.compile(rf"חולצת משחק {word} PUMA עונת 26/27 גבר")
    for p in products:
        if rx.search(p["title"]) and p.get("images"):
            return p["images"][0]["src"]
    raise SystemExit(f"no product for {word}")


def download(src, width=1600):
    url = re.sub(r"([?&])width=\d+", "", src)
    url += ("&" if "?" in url else "?") + f"width={width}"
    with urllib.request.urlopen(url, timeout=60) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def cutout(img):
    w, h = img.size
    # Near-white mask: 255 where min(r,g,b) is close to white.
    r, g, b = img.split()
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    white = darkest.point(lambda v: 255 if v >= 255 - TOLERANCE else 0)

    # Flood from a 1px white frame so every border-connected white pixel is hit.
    framed = Image.new("L", (w + 2, h + 2), 255)
    framed.paste(white, (1, 1))
    ImageDraw.floodfill(framed, (0, 0), 128)
    bg = framed.crop((1, 1, w + 1, h + 1)).point(lambda v: 255 if v == 128 else 0)

    alpha = ImageChops.invert(bg)
    alpha = alpha.filter(ImageFilter.MedianFilter(5))   # drop specks
    alpha = alpha.filter(ImageFilter.MinFilter(3))      # pull the edge in 1px
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.1)) # feather

    # Un-blend white from semi-transparent edge pixels: c = (c' - 255(1-a)) / a
    px, pa = img.load(), alpha.load()
    out = Image.new("RGBA", (w, h))
    po = out.load()
    for y in range(h):
        for x in range(w):
            a = pa[x, y]
            if a == 0:
                po[x, y] = (0, 0, 0, 0)
                continue
            c = px[x, y]
            if a < 255:
                f = a / 255
                c = tuple(max(0, min(255, round((v - 255 * (1 - f)) / f))) for v in c)
            po[x, y] = (*c, a)
    return out


def frame(rgba):
    box = rgba.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    rgba = rgba.crop(box)
    w, h = rgba.size
    side = max(w, h)
    pad = round(side * PAD)
    canvas = Image.new("RGBA", (side + 2 * pad, side + 2 * pad), (0, 0, 0, 0))
    canvas.paste(rgba, ((side - w) // 2 + pad, (side - h) // 2 + pad))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    products = json.loads(SNAPSHOT.read_text("utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    for key, word in KITS.items():
        src = find_image(products, word)
        print(f"{key}: {src}", file=sys.stderr)
        result = frame(cutout(download(src)))
        dest = OUT / f"{key}.webp"
        result.save(dest, "WEBP", quality=86, method=6, exact=False)
        print(f"  -> {dest.relative_to(ROOT)} {dest.stat().st_size // 1024}KB", file=sys.stderr)


if __name__ == "__main__":
    main()

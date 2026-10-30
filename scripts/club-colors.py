"""Shift saturated reds in match photos to Maccabi blue.

Opponent kits and some stands are red (the colour of the club's biggest rival),
so the site's photos are graded to keep red off the page. Run from the repo
root: python3 -I scripts/club-colors.py public/media/match-home-1.webp ...
Files are rewritten in place; originals are listed in public/media/CREDITS.md.
match-home-1 also had the Maccabi player's head restored from the original
(box 1000,0,1220,260) because his ear tipped into the red mask.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

TARGETS = {"blue": 158, "yellow": 36}  # PIL HSV scale (0-255): Maccabi blue ~223deg, yellow ~51deg


def recolor(path: str, target: str = "blue") -> None:
    im = Image.open(path).convert("RGB")
    hsv = np.asarray(im.convert("HSV")).astype(np.float32)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    # Distance from pure red on the hue circle, so both ends (0 and 255) count.
    d = np.minimum(h, 255 - h)
    if target == "yellow":
        # Flames run red to orange; widen the band so the oranges follow.
        d = np.where(h < 30, np.maximum(d - 10, 0), d)
    # Skin sits around the same hue at lower saturation, so the saturation gate is strict.
    weight = np.clip((12 - d) / 6, 0, 1) * np.clip((s - 125) / 45, 0, 1) * np.clip((v - 35) / 40, 0, 1)
    # Soften the mask so edges don't band.
    mask = Image.fromarray((weight * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    weight = np.asarray(mask).astype(np.float32) / 255
    shifted = hsv.copy()
    shifted[..., 0] = TARGETS[target]
    shifted[..., 1] = np.minimum(s * 0.95, 230)
    shifted[..., 2] = v * (0.72 if target == "blue" else 1.0)
    # Blend in RGB: blending hue directly would sweep red through orange and green.
    src = np.asarray(im).astype(np.float32)
    blue = np.asarray(Image.fromarray(shifted.astype(np.uint8), "HSV").convert("RGB")).astype(np.float32)
    out = Image.fromarray((src * (1 - weight[..., None]) + blue * weight[..., None]).astype(np.uint8))
    out.save(path, "WEBP", quality=84, method=6)
    print(f"{path}: recoloured {weight.mean() * 100:.1f}% of pixels")


if __name__ == "__main__":
    # --yellow turns red into club yellow instead (used for the fans' tifo,
    # whose flames should stay warm rather than turn blue).
    args = sys.argv[1:]
    target = "yellow" if "--yellow" in args else "blue"
    for p in (a for a in args if not a.startswith("--")):
        recolor(p, target)

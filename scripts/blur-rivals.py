"""Blur opposing players in red kits out of match photos.

Red is the colour of the club's biggest rival, so on the site those players
are softened into the background rather than recoloured. The crowd and the
Maccabi players stay untouched. Run from the repo root:
    python3 -I scripts/blur-rivals.py
Regions were located from the red mask of each photo and padded to cover the
whole player (head to boots). The source files are listed in public/media/CREDITS.md.
"""
from PIL import Image, ImageDraw, ImageFilter

REGIONS = {
    # file: [(left, top, right, bottom), ...] in source pixels (1920x1080)
    "public/media/match-home-1.webp": [(70, 150, 580, 1080), (1530, 0, 1920, 1080)],
}


def blur_regions(path: str, boxes: list[tuple[int, int, int, int]]) -> None:
    im = Image.open(path).convert("RGB")
    blurred = im.filter(ImageFilter.GaussianBlur(30))
    mask = Image.new("L", im.size, 0)
    draw = ImageDraw.Draw(mask)
    for box in boxes:
        draw.rounded_rectangle(box, radius=90, fill=255)
    # A wide feather so the blur dissolves into the pitch instead of ending in a hard edge.
    mask = mask.filter(ImageFilter.GaussianBlur(45))
    Image.composite(blurred, im, mask).save(path, "WEBP", quality=84, method=6)
    print(f"{path}: blurred {len(boxes)} region(s)")


if __name__ == "__main__":
    for file, boxes in REGIONS.items():
        blur_regions(file, boxes)

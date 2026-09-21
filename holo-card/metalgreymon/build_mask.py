#!/usr/bin/env python3
"""Build an aligned alpha mask for checkerboard matte: flood-fill gray regions seeded from corners."""
import sys
from collections import deque
from PIL import Image, ImageFilter

def build(rgb_path, mask_path):
    im = Image.open(rgb_path).convert('RGB')
    w, h = im.size
    px = im.load()

    def is_gray(p, lo=90, hi=245, tol=45):
        r, g, b = p
        if not (lo <= (r + g + b) / 3 <= hi):
            return False
        return max(r, g, b) - min(r, g, b) <= tol

    # candidate: gray pixels
    cand = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if is_gray(px[x, y]):
                cand[y * w + x] = 255

    # flood fill from all four corners
    alpha = bytearray([255]) * (w * h)  # default: keep artwork
    seen = bytearray(w * h)
    seeds = [(w // 2, h // 2), (w // 3, h // 3), (2 * w // 3, h // 3),
             (w // 3, 2 * h // 3), (2 * w // 3, 2 * h // 3),
             (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    q = deque()
    for sx, sy in seeds:
        i = sy * w + sx
        if cand[i] == 255 and not seen[i]:
            seen[i] = 1
            q.append(i)
    while q:
        i = q.popleft()
        alpha[i] = 0
        x, y = i % w, i // w
        for j in ([i - 1] if x else []) + ([i + 1] if x + 1 < w else []) + \
                 ([i - w] if y else []) + ([i + w] if y + 1 < h else []):
            if not seen[j] and cand[j] == 255:
                seen[j] = 1
                q.append(j)

    mask = Image.frombytes('L', (w, h), bytes(alpha))
    # slight feather on edges
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    mask.save(mask_path)
    print('mask saved:', mask_path, 'transparent px:', alpha.count(0), '/', w * h)

if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])

"""Render the artwork.

    python art/build.py dish:risotto --res 600 --spp 40 --out /tmp/preview   # quick look
    python art/build.py all                                                  # final assets -> public/img
"""
from __future__ import annotations

import argparse
import os
import sys
import time

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import cyc  # noqa: E402
from kit import Canvas  # noqa: E402

PUBLIC = os.path.join(os.path.dirname(HERE), "public", "img")


def grade(img: np.ndarray, exposure: float = 1.0, sat: float = 1.1, contrast: float = 1.06) -> np.ndarray:
    """Linear premultiplied RGBA -> display-referred straight-alpha RGBA (0..1)."""
    a = np.clip(img[..., 3], 0, 1)
    rgb = np.clip(img[..., :3], 0, None) / np.maximum(a, 1e-4)[..., None]
    rgb = rgb * exposure
    white = 3.2
    rgb = rgb * (1 + rgb / (white * white)) / (1 + rgb)        # soft shoulder
    rgb = np.clip(rgb, 0, 1) ** (1 / 2.2)
    lum = (rgb @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    rgb = lum + (rgb - lum) * sat
    rgb = (rgb - 0.5) * contrast + 0.5
    rgb = np.clip(rgb, 0, 1)
    rgb[a <= 0] = 0
    return np.dstack([rgb, a]).astype(np.float32)


def save(arr: np.ndarray, path: str, quality: int = 90):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8), "RGBA")
    if path.endswith(".webp"):
        im.save(path, "WEBP", quality=quality, method=6, alpha_quality=96, exact=False)
    else:
        im.save(path)
    return path


def shadow_of(arr: np.ndarray, blur_frac: float = 0.03) -> np.ndarray:
    """Blurred silhouette used as the cut-out's own drop shadow."""
    from scipy import ndimage as ndi
    a = ndi.gaussian_filter(arr[..., 3], arr.shape[0] * blur_frac)
    out = np.zeros_like(arr)
    out[..., 3] = np.clip(a, 0, 1)
    return out


def main():
    import dishes
    import ingredients
    ap = argparse.ArgumentParser()
    ap.add_argument("what", nargs="+", help="dish:<name>, ing:<name>, dishes, ings, linen or all")
    ap.add_argument("--res", type=int, default=0)
    ap.add_argument("--spp", type=int, default=0)
    ap.add_argument("--out", default="")
    ap.add_argument("--png", action="store_true")
    args = ap.parse_args()

    jobs = []
    for w in args.what:
        if w in ("all", "dishes"):
            jobs += [("dish", k) for k in dishes.DISHES]
        if w in ("all", "ings"):
            jobs += [("ing", k) for k in ingredients.INGREDIENTS]
        if w in ("all", "linen"):
            jobs += [("linen", "linen")]
        if ":" in w:
            kind, name = w.split(":")
            jobs.append((kind, name))

    for kind, name in jobs:
        t0 = time.time()
        ext = ".png" if args.png else ".webp"
        if kind == "linen":
            import linen
            arr = linen.make(args.res or 1024)
            out = os.path.join(args.out or PUBLIC, "linen" + (".png" if args.png else ".jpg"))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            im = Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8), "RGB")
            im.save(out, quality=90) if out.endswith(".jpg") else im.save(out)
            print("wrote", out, f"{time.time() - t0:.1f}s", flush=True)
            continue
        if kind == "dish":
            fn, opts = dishes.DISHES[name]
            res = args.res or 1200
            spp = args.spp or 110
        else:
            fn, opts = ingredients.INGREDIENTS[name]
            res = args.res or opts.get("res", 512)
            spp = args.spp or 110
        c = Canvas(res, seed=opts.get("seed", 7))
        fn(c)
        print(f"{kind}:{name} drawn in {time.time() - t0:.1f}s", flush=True)
        img = cyc.render(c.maps(), res, spp=spp, key=opts.get("key", 1.0), fill=opts.get("fill", 1.0),
                         sss_scale=opts.get("sss_scale", 0.012))
        arr = grade(img, exposure=opts.get("exposure", 1.0), sat=opts.get("sat", 1.1),
                    contrast=opts.get("contrast", 1.06))
        sub = "dishes" if kind == "dish" else "ingredients"
        base = os.path.join(args.out or os.path.join(PUBLIC, sub), name)
        print("wrote", save(arr, base + ext), f"{time.time() - t0:.1f}s", flush=True)
        if kind == "ing":
            save(shadow_of(arr), base + "-shadow" + ext, quality=80)


if __name__ == "__main__":
    main()

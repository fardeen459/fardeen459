"""A neutral, seamless plain-weave linen tile. The site multiplies a tint over it."""
from __future__ import annotations

import numpy as np
from scipy import ndimage as ndi

TAU = np.pi * 2


def _pnoise(rng, n, cells, octaves=3):
    """Periodic smooth noise in ~[-1, 1]."""
    out = np.zeros((n, n), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        c = cells * 2 ** o
        g = rng.standard_normal((c, c)).astype(np.float32)
        out += amp * ndi.zoom(g, n / c, order=3, mode="grid-wrap", grid_mode=True)
        tot += amp
        amp *= 0.5
    out /= tot
    return out / (out.std() + 1e-6) * 0.5


def make(n: int = 1024, threads: int = 74, seed: int = 5) -> np.ndarray:
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:n, 0:n].astype(np.float32) / n
    # threads wander a little and vary in thickness (slubs)
    u = x * threads + 0.22 * _pnoise(rng, n, 5)
    v = y * threads + 0.22 * _pnoise(rng, n, 5)
    iu, iv = np.floor(u), np.floor(v)
    fu, fv = u - iu, v - iv
    wu = 0.84 + 0.2 * _pnoise(rng, n, 9, 2) + 0.1 * rng.standard_normal(threads + 2)[(iu.astype(int)) % threads]
    wv = 0.84 + 0.2 * _pnoise(rng, n, 9, 2) + 0.1 * rng.standard_normal(threads + 2)[(iv.astype(int)) % threads]
    pu = np.sqrt(np.clip(1 - ((2 * fu - 1) / wu) ** 2, 0, 1))
    pv = np.sqrt(np.clip(1 - ((2 * fv - 1) / wv) ** 2, 0, 1))
    # over / under: each thread rides up where it crosses over its neighbour
    warp = pu * (0.55 + 0.45 * np.cos(np.pi * (v - 0.5) + np.pi * iu))
    weft = pv * (0.55 - 0.45 * np.cos(np.pi * (u - 0.5) + np.pi * iv))
    h = np.maximum(warp, weft)
    is_warp = warp >= weft
    # fibres run along each thread
    fib_u = _pnoise(rng, n, 160, 1)
    fibre = np.where(is_warp, ndi.gaussian_filter(fib_u, (5, 0.6), mode="wrap"),
                     ndi.gaussian_filter(fib_u, (0.6, 5), mode="wrap"))
    fibre = fibre / (fibre.std() + 1e-6)
    hs = ndi.gaussian_filter(h, 0.8, mode="wrap")
    gy, gx = np.gradient(hs)
    # light from the upper left, shallow relief
    k = 3.2
    nx, ny, nz = -gx * k, -gy * k, np.ones_like(hs)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    L = np.array([-0.42, -0.42, 0.8])
    L = L / np.linalg.norm(L)
    diff = (nx * L[0] + ny * L[1] + nz * L[2]) / ln
    ao = 0.55 + 0.45 * np.clip(hs / (ndi.gaussian_filter(hs, 4, mode="wrap") + 1e-3) * 0.75, 0, 1)
    tone = 1 + 0.035 * rng.standard_normal(threads + 2)[(np.where(is_warp, iu, iv).astype(int)) % threads]
    shade = (0.62 + 0.5 * diff) * ao * tone * (1 + 0.04 * fibre) * (1 + 0.03 * _pnoise(rng, n, 3, 2))
    shade = shade / np.percentile(shade, 97) * 0.965
    base = np.array([1.0, 0.985, 0.955], np.float32)
    img = np.clip(shade[..., None] * base, 0, 1)
    img = img ** 0.6
    return img.astype(np.float32)

"""Loose ingredients: cut-outs that lie on the cloth and fly out of an open dish."""
from __future__ import annotations

import numpy as np

from dishes import raspberry, walnut
from kit import F, TAU, Canvas, citrus, cov, drop, hexc, leaf, local, mixc, mound, spline, sstep, tube


def _leaf_from(c, sx, sy, ang, length, width, col, col2, **kw):
    cx, cy = sx + length / 2 * np.cos(ang), sy + length / 2 * np.sin(ang)
    leaf(c, cx, cy, length, width, ang, col, col2, alpha=True, **kw)


def basil(c: Canvas):
    g, g2 = hexc("#2c6a1c"), hexc("#6aa83a")
    stem = spline([(-0.12, 0.82), (-0.06, 0.5), (0.0, 0.22)], 16)
    tube(c, stem, np.linspace(0.03, 0.022, 16), hexc("#5c9a34"), hk=0.9, rough=0.5, sss=0.5, alpha=True)
    _leaf_from(c, 0.0, 0.3, -np.pi / 2 - 1.05, 0.72, 0.3, g, g2, curl=0.8, thick=0.02, lift=0.01)
    _leaf_from(c, 0.0, 0.3, -np.pi / 2 + 1.0, 0.68, 0.29, g, g2, curl=0.8, thick=0.02, lift=0.02)
    _leaf_from(c, 0.0, 0.28, -np.pi / 2 + 0.05, 1.02, 0.43, g * 1.05, g2, curl=0.9, thick=0.02, lift=0.04)


def mint(c: Canvas):
    g, g2 = hexc("#2f7a2a"), hexc("#86c965")
    stem = spline([(0.1, 0.85), (0.04, 0.4), (0.0, -0.1)], 20)
    tube(c, stem, np.linspace(0.03, 0.02, 20), hexc("#6aa544"), hk=0.9, rough=0.5, sss=0.5, alpha=True)
    for (sy, a, ln) in [(0.42, -0.35, 0.62), (0.42, np.pi + 0.35, 0.6), (0.02, -0.75, 0.5), (0.02, np.pi + 0.75, 0.5)]:
        _leaf_from(c, 0.03, sy, a, ln, ln * 0.4, g, g2, serrate=0.13, curl=0.7, thick=0.02, lift=0.02, veins=6)
    _leaf_from(c, 0.0, -0.05, -np.pi / 2, 0.66, 0.27, g * 1.08, g2, serrate=0.13, curl=0.8, thick=0.02, lift=0.05,
               veins=6)


def tomato(c: Canvas):
    vine = spline([(-0.78, 0.5), (-0.35, 0.2), (0.0, 0.02), (0.36, -0.14), (0.7, -0.5)], 30)
    tube(c, vine, 0.034, hexc("#5a8a2c"), hk=0.9, rough=0.5, sss=0.4, alpha=True)
    for (cx, cy, r, sk) in [(-0.32, 0.22, 0.4, "#c2201a"), (0.38, -0.12, 0.36, "#cf2a1c")]:
        sl, m, k = mound(c, cx, cy, r, height=r * 0.92, power=0.5, col=hexc(sk), rough=0.1, coat=1.0, sss=0.95,
                         sssr=np.array([1.0, 0.22, 0.1], F), spec=0.6, mode="rest", alpha=True)
        x, y = c.X[sl], c.Y[sl]
        blush = np.clip(0.5 + 0.5 * c.noise(sl, 2.5, 2), 0, 1) * m
        c.col[sl] = mixc(c.col[sl], hexc("#e2531f"), blush * 0.35)
        for i in range(5):
            a = i / 5 * TAU + cx * 3
            _leaf_from(c, cx, cy, a, r * 0.62, r * 0.13, hexc("#3f7a26"), hexc("#7fb04a"), curl=0.3, thick=0.012,
                       lift=0.0, veins=0, gloss=0.2, tip=0.6, mode="lay")
        drop(c, cx, cy, r * 0.09, hexc("#55802a"), height=r * 0.08, mode="lay", rough=0.5, coat=0.1, alpha=True)


def lemon(c: Canvas):
    citrus(c, 0.0, 0.0, 0.8, hexc("#f2c613"), hexc("#f8f1c9"), hexc("#f6dc55"), segs=10, thick=0.09, rot=0.3,
           mode="rest", alpha=True)


def orange(c: Canvas):
    citrus(c, 0.0, 0.0, 0.8, hexc("#f0811a"), hexc("#fbe3bf"), hexc("#f59a22"), segs=11, thick=0.09, rot=0.9,
           mode="rest", alpha=True)


def chili(c: Canvas):
    P = spline([(-0.62, 0.42), (-0.3, 0.3), (0.05, 0.02), (0.38, -0.32), (0.76, -0.56)], 60)
    t = np.linspace(0, 1, 60)
    R = 0.135 * (1 - t) ** 0.75 * (0.75 + 0.25 * sstep(0, 0.1, t)) + 0.012

    def col(tt, v, sl):
        base = mixc(hexc("#c3161a"), hexc("#8f0d14"), np.clip(0.4 + c.noise(sl, 3, 2), 0, 1))
        return mixc(base, hexc("#e63a2a"), np.clip(0.4 - np.abs(v), 0, 1) * 0.5)

    tube(c, P, R, col, hk=0.95, rough=0.1, coat=1.0, sss=0.8, sssr=np.array([1.0, 0.15, 0.1], F), spec=0.6,
         alpha=True)
    cap = spline([(-0.5, 0.38), (-0.62, 0.42), (-0.7, 0.45)], 8)
    tube(c, cap, np.linspace(0.11, 0.07, 8), hexc("#4c7a26"), hk=1.05, rough=0.45, sss=0.4, alpha=True)
    stem = spline([(-0.68, 0.44), (-0.8, 0.44), (-0.9, 0.3)], 12)
    tube(c, stem, np.linspace(0.045, 0.03, 12), hexc("#5d8a2e"), hk=0.95, rough=0.5, sss=0.4, alpha=True)


def garlic(c: Canvas):
    sl, x, y = c.full()
    d = np.hypot(x, y)
    th = np.arctan2(y, x) + 0.3
    lobes = 7
    rr = 0.7 * (1 + 0.075 * np.cos(th * lobes) + 0.02 * c.noise(sl, 2, 2))
    k = d / rr
    m = cov((k - 1) * 0.7, c.px)
    groove = np.abs(np.cos(th * lobes / 2)) ** 0.35
    h = 0.48 * np.clip(1 - k * k, 0, 1) ** 0.42 * (0.72 + 0.28 * groove)
    streak = 0.5 + 0.5 * np.cos(th * 46 + 5 * c.noise(sl, 3, 2))
    paper = mixc(hexc("#f4efe3"), hexc("#d9cdb6"), streak * 0.5)
    blush = np.clip(c.noise(sl, 2.2, 2) + 0.15, 0, 1) * sstep(0.25, 0.8, k)
    cv = mixc(paper, hexc("#b68aa6"), blush * 0.45)
    cv = mixc(cv, hexc("#b8a98a"), (1 - groove) * 0.5)
    c.put(sl, m, h=h, mode="set", z=0.0, col=cv, rough=0.5, coat=0.15, sss=0.6, sssr=np.array([1.0, 0.8, 0.6], F),
          alpha=True)
    drop(c, 0.0, 0.0, 0.085, hexc("#b79a6a"), height=0.1, mode="lay", rough=0.7, coat=0.0, sss=0.2)
    for i in range(9):
        a = i / 9 * TAU
        P = spline([(0.02 * np.cos(a), 0.02 * np.sin(a)), (0.1 * np.cos(a + 0.4), 0.1 * np.sin(a + 0.4))], 6)
        tube(c, P, 0.012, hexc("#8a6f45"), hk=0.8, mode="lay", rough=0.8)


def parsley(c: Canvas):
    g, g2 = hexc("#2e6a1c"), hexc("#5f9d33")
    stem = spline([(0.06, 0.9), (0.02, 0.45), (0.0, 0.05)], 20)
    tube(c, stem, np.linspace(0.026, 0.02, 20), hexc("#5d9a36"), hk=0.9, rough=0.5, sss=0.5, alpha=True)
    for (sx, sy, a0, sc) in [(0.0, 0.08, -np.pi / 2, 1.0), (0.01, 0.3, -np.pi / 2 - 1.05, 0.8),
                             (0.01, 0.3, -np.pi / 2 + 1.05, 0.8)]:
        ln = 0.26 * sc
        bx, by = sx + ln * np.cos(a0), sy + ln * np.sin(a0)
        tube(c, np.array([(sx, sy), (bx, by)]), 0.016, hexc("#5d9a36"), hk=0.9, rough=0.5, sss=0.5, alpha=True)
        for da, l2 in ((-0.85, 0.36), (0.85, 0.36), (0.0, 0.46)):
            for dd in (-0.3, 0.3, 0.0):
                _leaf_from(c, bx, by, a0 + da + dd, l2 * sc * (1.0 if dd == 0 else 0.8), 0.12 * sc, g, g2,
                           serrate=0.3, curl=0.5, thick=0.014, lift=0.01, veins=3, gloss=0.25, tip=0.7)


def walnuts(c: Canvas):
    walnut(c, -0.3, 0.14, 0.44, 0.35, alpha=True)
    walnut(c, 0.42, -0.2, 0.36, 2.2, alpha=True)


def rosemary(c: Canvas):
    stem = spline([(-0.72, 0.62), (-0.3, 0.3), (0.12, -0.1), (0.66, -0.62)], 44)
    tube(c, stem, np.linspace(0.028, 0.014, 44), hexc("#6a5632"), hk=0.9, rough=0.7, alpha=True)
    for i in range(3, 43):
        d = stem[min(i + 1, 43)] - stem[i - 1]
        a0 = np.arctan2(d[1], d[0])
        for sgn in (-1, 1):
            a = a0 + sgn * c.rng.uniform(0.55, 1.05)
            ln = c.rng.uniform(0.26, 0.36) * (1 - 0.45 * (i / 43) ** 3)
            px_, py_ = stem[i] + ln * 0.5 * np.array([np.cos(a), np.sin(a)])
            leaf(c, px_, py_, ln, 0.034, a, hexc("#3c5c30"), hexc("#86a273"), curl=0.0, thick=0.02, veins=0,
                 gloss=0.15, mode="lay", tip=0.5, alpha=True)


def pomegranate(c: Canvas):
    pts = [(0.0, 0.0), (0.33, 0.06), (-0.3, 0.12), (0.1, 0.34), (-0.12, -0.33), (0.3, -0.28), (-0.42, -0.2),
           (0.5, 0.36), (-0.2, 0.47), (0.62, -0.02), (-0.6, 0.2), (0.1, -0.62), (0.4, 0.62), (-0.52, -0.5)]
    for (px_, py_) in pts:
        r = c.rng.uniform(0.15, 0.185)
        drop(c, px_ + c.rng.uniform(-0.03, 0.03), py_ + c.rng.uniform(-0.03, 0.03), r,
             hexc("#a50f2a") * c.rng.uniform(0.8, 1.25), height=r * 0.8, ry=r * c.rng.uniform(0.72, 0.9),
             ang=c.rng.uniform(0, np.pi), mode="lay", rough=0.07, coat=1.0, sss=0.95,
             sssr=np.array([1.0, 0.12, 0.14], F), alpha=True)


def raspberries(c: Canvas):
    raspberry(c, -0.36, 0.22, 0.36, alpha=True)
    raspberry(c, 0.36, 0.02, 0.33, alpha=True)
    raspberry(c, -0.04, -0.48, 0.3, alpha=True)


def peppercorns(c: Canvas):
    pts = [(-0.5, -0.3), (-0.12, -0.52), (0.3, -0.42), (0.6, -0.12), (0.1, -0.1), (-0.35, 0.12), (0.42, 0.25),
           (-0.02, 0.4), (-0.62, 0.42), (0.66, 0.55), (0.25, 0.68), (-0.3, 0.68), (-0.72, -0.02)]
    cols = ["#1f1712", "#2a1e16", "#17110d", "#1f1712", "#a84a3c", "#2a1e16", "#1c1510", "#6e7a3a", "#241a13"]
    for i, (px_, py_) in enumerate(pts):
        r = c.rng.uniform(0.095, 0.125)
        sl, m, k = mound(c, px_, py_, r, height=r * 0.95, power=0.5, lumps=0.22, lump_freq=22,
                         col=hexc(cols[i % len(cols)]), rough=0.55, coat=0.15, sss=0.1, mode="rest", alpha=True)
        wr = c.noise(sl, 26, 2)
        c.col[sl] = mixc(c.col[sl], c.col[sl] * 2.2 + 0.02, np.clip(wr, 0, 1) * m * 0.6)


def olives(c: Canvas):
    for (px_, py_, a, rx, col) in [(-0.34, 0.2, 0.5, 0.36, "#7a8a2c"), (0.38, 0.08, 2.4, 0.33, "#8c9a34"),
                                   (-0.02, -0.46, 1.3, 0.31, "#6e7f28")]:
        sl, m, k = mound(c, px_, py_, rx, rx * 0.74, a, height=rx * 0.72, power=0.5, col=hexc(col), rough=0.14,
                         coat=0.9, sss=0.7, sssr=np.array([0.7, 1.0, 0.2], F), mode="rest", alpha=True)
        mott = np.clip(0.5 + c.noise(sl, 6, 3), 0, 1) * m
        c.col[sl] = mixc(c.col[sl], hexc("#a8b04a"), mott * 0.35)
        ex, ey = px_ + rx * 0.82 * np.cos(a), py_ + rx * 0.82 * np.sin(a)
        drop(c, ex, ey, 0.04, hexc("#3a3a16"), height=0.0, mode="drape", rough=0.6, coat=0.0, sss=0.0)


INGREDIENTS = {
    "basil": (basil, dict(seed=2)),
    "mint": (mint, dict(seed=4)),
    "tomato": (tomato, dict(seed=6)),
    "lemon": (lemon, dict(seed=8)),
    "orange": (orange, dict(seed=10)),
    "chili": (chili, dict(seed=12)),
    "garlic": (garlic, dict(seed=14)),
    "parsley": (parsley, dict(seed=16)),
    "walnut": (walnuts, dict(seed=18)),
    "rosemary": (rosemary, dict(seed=20)),
    "pomegranate": (pomegranate, dict(seed=22)),
    "raspberry": (raspberries, dict(seed=24)),
    "peppercorn": (peppercorns, dict(seed=26)),
    "olive": (olives, dict(seed=28)),
}

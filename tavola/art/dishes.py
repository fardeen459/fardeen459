"""The eight plates, drawn from above."""
from __future__ import annotations

import numpy as np

from kit import (F, TAU, Canvas, citrus, cov, drop, flecks, grill, hexc, in_disc, leaf, local, mixc, mound, plate,
                 smear, spline, sstep, tube)


def tart(c: Canvas):
    plate(c, glaze="#efeae0", well=0.7)
    X, Y = c.X, c.Y
    sl = (slice(None), slice(None))
    R = np.hypot(X, Y)
    TH = np.arctan2(Y, X)
    # --- pastry case: a fluted ring ------------------------------------
    flutes = 30
    ro = 0.52 * (1 + 0.035 * np.cos(TH * flutes))
    ri = 0.445
    wob = c.noise(sl, 7, 3)
    sd = np.maximum(R - ro, -(R - 0.0))
    m = cov(R - ro, c.px)
    crust_h = 0.15 * sstep(0.0, 0.03, ro - R) + 0.012 * wob * (R > ri)
    crumb = c.noise(sl, 60, 2)
    bake = np.clip(0.5 + 0.9 * c.noise(sl, 3.2, 3) + 0.5 * np.cos(TH * flutes), 0, 1)
    crust = mixc(hexc("#d9a55c"), hexc("#9c5f24"), bake * 0.75)
    crust = crust * (0.9 + 0.16 * crumb)[..., None]
    c.put(sl, m, h=crust_h + 0.004 * crumb, mode="set", z=0.03, col=crust, rough=0.85, coat=0.0, sss=0.25, spec=0.3)
    # --- curd -----------------------------------------------------------
    mc = cov(R - ri, c.px * 1.5)
    curd_h = 0.118 + 0.006 * (1 - (R / ri) ** 2) + 0.0016 * c.noise(sl, 2.5, 2)
    curd = mixc(hexc("#f6c21c"), hexc("#f9d648"), np.clip(0.5 + c.noise(sl, 2.0, 2), 0, 1))
    c.put(sl, mc, h=curd_h, mode="set", z=0.03, col=curd, rough=0.07, coat=1.0, sss=0.75, spec=0.6,
          sssr=np.array([1.0, 0.75, 0.2], F))
    # --- torched meringue kisses around the rim ------------------------
    n = 13
    for i in range(n):
        a = i / n * TAU + 0.12
        rr = 0.345 + c.rng.uniform(-0.006, 0.006)
        cx, cy = rr * np.cos(a), rr * np.sin(a)
        r = 0.066 * c.rng.uniform(0.92, 1.08)
        s2, x, y = c.win(cx, cy, r * 1.2)
        d = np.hypot(x - cx, y - cy)
        th = np.arctan2(y - cy, x - cx)
        k = d / r
        star = 1 + 0.07 * np.cos(th * 8 + k * 3.2 + i)
        kk = k / star
        mm = cov((kk - 1) * r, c.px)
        hh = 0.115 * np.clip(1 - kk, 0, 1) ** 0.75 + 0.02 * np.clip(1 - kk * kk, 0, 1)
        toast = sstep(0.3, 0.85, 1 - kk) * (0.8 + 0.5 * c.noise(s2, 20, 2))
        toast = np.clip(toast + 0.25 * sstep(0.03, 0.07, hh) * (np.cos(th * 8 + k * 3.2 + i) > 0.5), 0, 1)
        cv = mixc(hexc("#fbf6ea"), hexc("#a8611f"), toast * 0.85)
        c.put(s2, mm, h=hh, mode="rest", q=0.5, col=cv, rough=0.55, coat=0.1, sss=0.7, spec=0.4,
              sssr=np.array([1.0, 0.8, 0.6], F))
    # --- raspberries ----------------------------------------------------
    for (cx, cy, r) in [(-0.07, -0.05, 0.085), (0.1, 0.02, 0.08), (-0.01, 0.12, 0.078), (0.05, -0.15, 0.07),
                        (-0.15, 0.07, 0.068)]:
        raspberry(c, cx, cy, r)
    # --- mint + zest + sugar -------------------------------------------
    leaf(c, 0.18, 0.11, 0.13, 0.05, 0.6, hexc("#2f7a2a"), hexc("#7cc15a"), serrate=0.12, lift=0.02, q=0.9)
    leaf(c, -0.13, -0.17, 0.11, 0.045, 3.6, hexc("#2f7a2a"), hexc("#7cc15a"), serrate=0.12, lift=0.02, q=0.9)
    flecks(c, 26, in_disc(c, 0, 0, 0.3), 0.012, [hexc("#f4d94a"), hexc("#ffe680")], height=0.006, aspect=(3, 6),
           rough=0.5, sss=0.5)
    flecks(c, 500, in_disc(c, 0, 0, 0.62), 0.0028, [np.array([1, 1, 1], F)], height=0.002, aspect=(1, 1.3), rough=0.9)
    # coulis beads on the plate
    for a, rr, r in [(0.3, 0.62, 0.022), (0.5, 0.6, 0.014), (0.66, 0.63, 0.009), (3.5, 0.61, 0.02), (3.72, 0.63, 0.012)]:
        drop(c, rr * np.cos(a), rr * np.sin(a), r, hexc("#b3122f"), sssr=np.array([1.0, 0.2, 0.15], F), sss=0.6)


def raspberry(c: Canvas, cx, cy, r, col="#b8163f", alpha=False):
    """Drupelets packed in rings around a dome."""
    base = hexc(col)
    sl, x, y = c.win(cx, cy, r * 1.25)
    d = np.hypot(x - cx, y - cy)
    m = cov(d - r * 1.02, c.px)
    core = 0.8 * r * np.sqrt(np.clip(1 - (d / (r * 1.02)) ** 2, 0, 1))
    c.put(sl, m, h=core, mode="rest", q=0.6, col=base * 0.45, rough=0.5, sss=0.8, coat=0.2,
          sssr=np.array([1.0, 0.15, 0.2], F), sheen=0.4, alpha=alpha)
    rings = [(0.0, 1), (0.36, 6), (0.68, 11), (0.93, 15)]
    rot = c.rng.uniform(0, TAU)
    zb = float(np.quantile(c.h[sl][m > 0.5], 0.05)) if (m > 0.5).any() else 0.0
    for fr, cnt in rings:
        for i in range(cnt):
            a = rot + i / cnt * TAU + fr * 2.1
            px_, py_ = cx + fr * r * np.cos(a), cy + fr * r * np.sin(a)
            br = r * 0.22 * c.rng.uniform(0.9, 1.1)
            s2, xx, yy = c.win(px_, py_, br * 1.2)
            dd = np.hypot(xx - px_, yy - py_)
            mm = cov(dd - br, c.px)
            dome = 0.8 * r * np.sqrt(max(0.0, 1 - fr * fr * 0.92))
            hh = dome + br * 0.9 * np.sqrt(np.clip(1 - (dd / br) ** 2, 0, 1))
            cvv = base * c.rng.uniform(0.82, 1.18)
            H = c.h[s2]
            H[...] = np.where(mm > 0.05, np.maximum(H, zb + hh), H)
            c.put(s2, mm, col=cvv, rough=0.32, sss=0.9, coat=0.35, sssr=np.array([1.0, 0.15, 0.2], F), sheen=0.3,
                  alpha=alpha)




# ----------------------------------------------------------------------
# shared bits
# ----------------------------------------------------------------------
def pepper(c: Canvas, n, where, size=0.0045):
    flecks(c, n, where, size, [hexc("#1d1712"), hexc("#3a2c20"), hexc("#0f0c0a")], height=0.004, aspect=(1, 1.6),
           rough=0.8)


def salt(c: Canvas, n, where, size=0.006):
    flecks(c, n, where, size, [np.array([1, 1, 1], F), np.array([0.92, 0.92, 0.9], F)], height=0.006,
           aspect=(1, 1.5), rough=0.25, sss=0.8, coat=0.4)


def herbs(c: Canvas, n, where, size=0.008, cols=("#3c7a22", "#2c5f1a", "#5c9a30")):
    flecks(c, n, where, size, [hexc(k) for k in cols], height=0.004, aspect=(1.2, 2.6), rough=0.6, sss=0.4)


def tomato_wedge(c: Canvas, cx, cy, L, W, ang, skin, flesh):
    """A wedge lying cut-face up: skin arc on one side, core on the other."""
    skin, flesh = hexc(skin), hexc(flesh)
    sl, x, y = c.win(cx, cy, L * 0.62)
    u, v = local(x, y, cx, cy, ang)
    v = v + W * 0.42
    a, b = L / 2, W
    k = np.sqrt((u / a) ** 2 + (v / b) ** 2)
    k = k * (1 + 0.025 * c.noise(sl, 6 / L, 2))
    sd = np.maximum((k - 1) * b, -v)
    m = cov(sd, c.px)
    wall = sstep(0.74, 0.86, k)
    core = sstep(0.16 * b, 0.05 * b, v)
    rib = np.exp(-(u / (0.07 * L)) ** 2)
    gel = np.clip(1 - np.maximum(np.maximum(wall, core), rib), 0, 1)
    gelcol = (flesh * 0.55 + hexc("#c8b02a") * 0.45) * 0.8
    cv = mixc(flesh * 1.12, gelcol, gel)
    cv = mixc(cv, flesh * 1.5 + 0.06, core * 0.7)
    cv = mixc(cv, skin, sstep(0.9, 0.97, k))
    cv = cv * (0.93 + 0.14 * c.noise(sl, 20 / L, 2))[..., None]
    h = 0.062 * np.clip(1 - k * k, 0, 1) ** 0.35 * sstep(0.0, 0.03, v) * (1 - 0.12 * gel)
    c.put(sl, m, h=h, mode="lay", span=0.03, col=cv, rough=0.2 - 0.1 * gel, coat=0.55 + 0.4 * gel, sss=0.95,
          spec=0.55, sssr=np.array([1.0, 0.25, 0.1], F))
    # seeds suspended in the gel
    for _ in range(9):
        su = c.rng.uniform(-0.36, 0.36) * L
        sv = c.rng.uniform(0.22, 0.62) * W
        if abs(su) < 0.07 * L:
            continue
        ca, sa = np.cos(ang), np.sin(ang)
        vx = sv - W * 0.42
        px_, py_ = cx + su * ca - vx * sa, cy + su * sa + vx * ca
        flecks(c, 1, lambda: (px_, py_), 0.0075 * (L / 0.25), [hexc("#f0e2a0")], height=0.003, aspect=(1.4, 2.0),
               rough=0.3, sss=0.6, coat=0.5)


def cherry_half(c: Canvas, cx, cy, r, skin, flesh):
    skin, flesh = hexc(skin), hexc(flesh)
    sl, x, y = c.win(cx, cy, r * 1.15)
    d = np.hypot(x - cx, y - cy)
    th = np.arctan2(y - cy, x - cx) + c.rng.uniform(0, TAU)
    k = d / r
    m = cov((k - 1) * r, c.px)
    rib = np.abs(((th / TAU * 3) % 1) - 0.5) * 2
    solid = np.maximum(np.maximum(sstep(0.7, 0.82, k), sstep(0.25, 0.12, k)), sstep(0.72, 0.9, rib))
    gelcol = (flesh * 0.5 + hexc("#c8b02a") * 0.5) * 0.8
    cv = mixc(gelcol, flesh * 1.15, solid)
    cv = mixc(cv, skin, sstep(0.9, 0.97, k))
    h = 0.05 * np.clip(1 - k ** 4, 0, 1) ** 0.5 * (0.9 + 0.1 * solid)
    c.put(sl, m, h=h, mode="lay", span=0.03, col=cv, rough=0.14 + 0.08 * solid, coat=0.9 - 0.3 * solid, sss=0.95,
          sssr=np.array([1.0, 0.25, 0.1], F))
    for _ in range(7):
        a = c.rng.uniform(0, TAU)
        rr = c.rng.uniform(0.35, 0.62) * r
        px_, py_ = cx + rr * np.cos(a), cy + rr * np.sin(a)
        flecks(c, 1, lambda: (px_, py_), 0.006, [hexc("#f0e2a0")], height=0.003, aspect=(1.4, 2.0), rough=0.3,
               sss=0.6, coat=0.5)


def aril(c: Canvas, cx, cy, r=0.02, mode="lay"):
    drop(c, cx, cy, r * c.rng.uniform(0.9, 1.15), hexc("#a40f2c") * c.rng.uniform(0.8, 1.2), height=r * 0.85,
         ry=r * c.rng.uniform(0.7, 0.9), ang=c.rng.uniform(0, np.pi), mode=mode, rough=0.08, coat=1.0, sss=0.95,
         sssr=np.array([1.0, 0.12, 0.14], F))


def walnut(c: Canvas, cx, cy, r, ang, mode="lay", alpha=False):
    sl, x, y = c.win(cx, cy, r * 1.3)
    u, v = local(x, y, cx, cy, ang)
    k = np.sqrt((u / r) ** 2 + (v / (r * 0.82)) ** 2)
    lobe = 1 + 0.1 * np.cos(np.arctan2(v, u) * 2) + 0.07 * c.noise(sl, 5 / r, 2)
    k = k / lobe
    m = cov((k - 1) * r * 0.8, c.px)
    folds = c.noise(sl, 3.2 / r, 2)
    ridge = 1 - np.abs(folds) * 1.7
    seam = np.exp(-(v / (0.1 * r)) ** 2)
    h = 0.62 * r * np.clip(1 - k * k, 0, 1) ** 0.5 * (0.62 + 0.38 * np.clip(ridge, 0, 1)) * (1 - 0.35 * seam)
    cv = mixc(hexc("#7a4a22"), hexc("#d2a063"), np.clip(ridge * 0.9, 0, 1))
    cv = mixc(cv, hexc("#5a3417"), seam * 0.6)
    c.put(sl, m, h=h, mode=mode, span=0.03, col=cv, rough=0.6, coat=0.1, sss=0.3, alpha=alpha)


def dollop(c: Canvas, cx, cy, r, col="#fbf8f0", height=None, swirl=6):
    sl, x, y = c.win(cx, cy, r * 1.2)
    d = np.hypot(x - cx, y - cy)
    th = np.arctan2(y - cy, x - cx)
    k = d / r
    star = 1 + 0.05 * np.cos(th * swirl + k * 4.0)
    kk = k / star
    m = cov((kk - 1) * r, c.px)
    h = (height or r * 1.0) * (np.clip(1 - kk, 0, 1) ** 0.8 * 0.7 + 0.3 * np.clip(1 - kk * kk, 0, 1))
    c.put(sl, m, h=h, mode="lay", span=0.03, col=hexc(col), rough=0.5, coat=0.15, sss=0.9,
          sssr=np.array([1.0, 0.85, 0.7], F))


# ----------------------------------------------------------------------
# 01 burrata, heirloom tomato
# ----------------------------------------------------------------------
def burrata(c: Canvas):
    plate(c, glaze="#efebe3", well=0.68)
    oil = hexc("#7c9a1a")
    oilmat = dict(height=0.004, sss=0.7, sssr=np.array([0.7, 1.0, 0.15], F), rough=0.05)
    for _ in range(34):
        a = c.rng.uniform(0, TAU)
        rr = c.rng.uniform(0.25, 0.64)
        drop(c, rr * np.cos(a), rr * np.sin(a), c.rng.uniform(0.012, 0.055), oil * c.rng.uniform(0.8, 1.2), **oilmat)
    pal = [("#b8201a", "#dc4a33"), ("#e0701a", "#f29a45"), ("#e2ab14", "#f5cf55"), ("#a81b22", "#d5412f"),
           ("#d9601c", "#ee8c3c")]
    n = 10
    for i in range(n):
        a = i / n * TAU + c.rng.uniform(-0.08, 0.08) + 0.3
        rr = 0.47 + c.rng.uniform(-0.03, 0.03)
        sk, fl = pal[i % len(pal)]
        tomato_wedge(c, rr * np.cos(a), rr * np.sin(a), 0.3 * c.rng.uniform(0.92, 1.08), 0.15,
                     a + np.pi / 2 + c.rng.uniform(-0.45, 0.45), sk, fl)
    for a, rr, r, p in [(0.62, 0.6, 0.062, 2), (2.2, 0.61, 0.058, 0), (3.45, 0.6, 0.06, 1), (5.0, 0.61, 0.055, 3),
                        (1.5, 0.33, 0.05, 4), (4.15, 0.34, 0.052, 2)]:
        cherry_half(c, rr * np.cos(a), rr * np.sin(a), r, *pal[p])
    # the cheese: a soft pouch, gathered at the top
    sl, x, y = c.win(0.0, 0.0, 0.34)
    d = np.hypot(x, y)
    th = np.arctan2(y + 0.035, x - 0.02)
    k = d / (0.295 * (1 + 0.035 * c.noise(sl, 2.2, 2)))
    m = cov((k - 1) * 0.295, c.px)
    dk = np.hypot(x - 0.02, y + 0.035)
    pleat = 0.012 * np.cos(th * 11 + 2 * c.noise(sl, 2, 1)) * np.exp(-(dk / 0.13) ** 2)
    knot = 0.03 * np.exp(-(dk / 0.035) ** 2)
    h = 0.21 * np.clip(1 - k * k, 0, 1) ** 0.45 * (1 + 0.05 * c.noise(sl, 3.5, 3)) + (pleat + knot) * (k < 0.95)
    cheese = mixc(hexc("#fbf8ef"), hexc("#f2ead8"), np.clip(0.5 + c.noise(sl, 3, 2), 0, 1))
    c.put(sl, m, h=h, mode="rest", q=0.3, col=cheese, rough=0.36, coat=0.3, sss=1.0, spec=0.5,
          sssr=np.array([1.0, 0.85, 0.7], F))
    # basil oil running over it
    for _ in range(22):
        a, rr = c.rng.uniform(0, TAU), np.sqrt(c.rng.uniform(0, 1)) * 0.23
        drop(c, rr * np.cos(a) - 0.01, rr * np.sin(a) + 0.02, c.rng.uniform(0.006, 0.024), oil * 0.95,
             height=0.003, sss=0.7, sssr=np.array([0.7, 1.0, 0.15], F), rough=0.05)
    herbs(c, 46, in_disc(c, 0.0, 0.0, 0.24), 0.006, cols=("#4f8a1c", "#35691a"))
    for (lx, ly, ln, ang) in [(-0.2, -0.17, 0.22, -2.3), (0.22, 0.14, 0.19, 0.7), (0.07, -0.25, 0.15, -1.2),
                              (-0.4, 0.33, 0.14, 2.4), (0.46, -0.24, 0.13, -0.4), (-0.02, 0.3, 0.12, 1.5)]:
        leaf(c, lx, ly, ln, ln * 0.36, ang, hexc("#2e6f1c"), hexc("#69a83a"), curl=0.7, lift=0.012, q=0.85)
    pepper(c, 90, in_disc(c, 0, 0, 0.62))
    salt(c, 50, in_disc(c, 0, 0, 0.55))


# ----------------------------------------------------------------------
# 02 charred octopus
# ----------------------------------------------------------------------
def tentacle(c: Canvas, ctrl, r0, r1=0.011, flip=1.0, n=90):
    P = spline(ctrl, n)
    t = np.linspace(0, 1, n)
    R = r1 + (r0 - r1) * (1 - t) ** 1.2
    R[:4] *= np.array([0.6, 0.8, 0.93, 1.0])
    skin, dark, belly = hexc("#743039"), hexc("#1d0d0b"), hexc("#f1d0c2")

    def col(tt, v, sl):
        nz = c.noise(sl, 8, 3)
        top = mixc(skin, dark, sstep(-0.25, 0.5, nz + 0.35 * (1 - np.abs(v)) - 0.1))
        top = top * (0.85 + 0.3 * c.noise(sl, 40, 2))[..., None]
        return mixc(top, belly, sstep(0.2, 0.6, v * flip))

    tube(c, P, R, col, hk=0.92, mode="lay", span=0.05, bump=lambda tt, v, sl: 0.003 * c.noise(sl, 35, 2),
         rough=0.3, coat=0.6, sss=0.7, sssr=np.array([1.0, 0.4, 0.35], F))
    tan = np.gradient(P, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True) + 1e-9
    nor = np.stack([-tan[:, 1], tan[:, 0]], -1) * flip
    L = float(np.hypot(*np.diff(P, axis=0).T).sum())
    s = 0.03
    while s < 0.985:
        i = int(s * (n - 1))
        rr = R[i]
        for row, off in ((0, 0.5), (1, 0.84)):
            qx, qy = P[i] + nor[i] * rr * off + tan[i] * (0.42 * rr * row)
            rs = rr * 0.25
            if rs < 1.2 * c.px:
                continue
            sl2, x, y = c.win(qx, qy, rs * 1.3)
            k = np.hypot(x - qx, y - qy) / rs
            mm = cov((k - 1) * rs, c.px)
            ring = np.exp(-((k - 0.6) / 0.3) ** 2)
            cv = mixc(hexc("#f8e6da"), hexc("#b8687a"), sstep(0.5, 0.0, k) * 0.8)
            c.put(sl2, mm, h=0.45 * rs * ring, mode="drape", col=cv, rough=0.35, coat=0.4, sss=0.8)
        s += 0.8 * rr / L


def octopus(c: Canvas):
    plate(c, glaze="#ede7dc", well=0.68)
    # smoked pepper puree
    P = spline([(-0.47, 0.2), (-0.3, 0.37), (-0.02, 0.42), (0.26, 0.33), (0.45, 0.12), (0.5, -0.1)], 70)
    t = np.linspace(0, 1, 70)
    W = 0.15 * (1 - t) ** 0.7 * sstep(0, 0.06, t) + 0.02
    smear(c, P, W, hexc("#cf3b1a"), thick=0.022, grooves=7, rough=0.22, coat=0.6, sss=0.7,
          sssr=np.array([1.0, 0.3, 0.1], F))
    for (px_, py_, r) in [(-0.33, -0.25, 0.03), (-0.42, -0.14, 0.018), (-0.25, -0.36, 0.012), (0.36, 0.44, 0.02),
                          (0.5, 0.3, 0.012)]:
        drop(c, px_, py_, r, hexc("#cf3b1a"), sss=0.7, sssr=np.array([1.0, 0.3, 0.1], F), rough=0.15)
    # crushed potatoes
    for (px_, py_, r, a) in [(0.3, -0.34, 0.1, 0.4), (-0.02, -0.44, 0.085, 2.0), (0.47, -0.02, 0.08, 1.0),
                             (-0.36, 0.02, 0.075, 0.2)]:
        sl, m, k = mound(c, px_, py_, r, r * 0.8, a, height=0.075, power=0.4, lumps=0.3, lump_freq=11,
                         edge_wobble=0.14, col=hexc("#e8c45c"), rough=0.6, coat=0.25, sss=0.6, mode="rest", q=0.5)
        brown = np.clip(c.noise(sl, 9, 3) * 1.4 + 0.2, 0, 1) * m
        c.col[sl] = mixc(c.col[sl], hexc("#a8641c"), brown * 0.75)
    tentacle(c, [(-0.5, -0.1), (-0.3, -0.33), (0.0, -0.25), (0.14, 0.02), (-0.02, 0.2), (-0.16, 0.08), (-0.08, -0.02),
                 (-0.02, 0.05)], 0.082, flip=1)
    tentacle(c, [(0.52, 0.3), (0.5, 0.0), (0.28, -0.12), (0.12, 0.12), (0.26, 0.3), (0.38, 0.2), (0.3, 0.12)],
             0.07, flip=-1)
    tentacle(c, [(-0.2, 0.5), (-0.38, 0.3), (-0.3, 0.14), (-0.18, 0.22), (-0.24, 0.3)], 0.045, flip=1, n=60)
    # capers, herbs, oil
    for _ in range(13):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.1, 0.56)
        drop(c, rr * np.cos(a), rr * np.sin(a), c.rng.uniform(0.014, 0.019), hexc("#5d6b24") * c.rng.uniform(0.8, 1.2),
             height=0.016, mode="lay", rough=0.3, coat=0.5, sss=0.5)
    for _ in range(18):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.2, 0.62)
        drop(c, rr * np.cos(a), rr * np.sin(a), c.rng.uniform(0.008, 0.03), hexc("#d9a520"), height=0.003, sss=0.8,
             sssr=np.array([1.0, 0.8, 0.2], F))
    herbs(c, 60, in_disc(c, 0, 0, 0.55), 0.008)
    flecks(c, 420, in_disc(c, 0.0, 0.0, 0.62), 0.0035, [hexc("#b3321a"), hexc("#8f2412")], height=0.002,
           aspect=(1, 1.4), rough=0.8)
    salt(c, 30, in_disc(c, 0, 0, 0.45))


# ----------------------------------------------------------------------
# 03 saffron risotto
# ----------------------------------------------------------------------
def prawn(c: Canvas, cx, cy, ang, size=0.3, arc=3.3, flip=1.0):
    n = 50
    t = np.linspace(0, 1, n)
    th = t * arc
    rho = size * 0.48 * (1 - 0.3 * t)
    lx, ly = rho * np.cos(th) - size * 0.2, rho * np.sin(th) * flip
    ca, sa = np.cos(ang), np.sin(ang)
    P = np.stack([cx + lx * ca - ly * sa, cy + lx * sa + ly * ca], -1)
    R = size * 0.2 * (1 - 0.58 * t) * (0.55 + 0.45 * sstep(0, 0.09, t))
    nseg = 6.5
    R = R * (1 + 0.05 * np.cos(t * nseg * TAU))
    shell, band, pale, char = hexc("#f28e52"), hexc("#d83f24"), hexc("#fbdcc6"), hexc("#3b1a0d")
    inner = flip      # the belly is on the inside of the curl

    def col(tt, v, sl):
        vi = v * inner
        joint = np.exp(-((((tt * nseg) % 1) - 0.5) / 0.14) ** 2)
        back = mixc(shell, band, np.clip(joint * 0.9 + 0.25 * sstep(0.0, -0.9, vi), 0, 1))
        body = mixc(back, pale, sstep(0.05, 0.75, vi))
        white = np.exp(-((((tt * nseg) % 1) - 0.0) / 0.08) ** 2) + np.exp(-((((tt * nseg) % 1) - 1.0) / 0.08) ** 2)
        body = mixc(body, pale * 1.05, np.clip(white, 0, 1) * 0.45)
        burn = sstep(0.25, 0.85, c.noise(sl, 7, 3) + 0.25 * (1 - np.abs(v)))
        return mixc(body, char, burn * 0.6)

    tube(c, P, R, col, hk=0.95, mode="lay", span=0.05, sink=0.012, rough=0.3, coat=0.6, sss=0.8,
         sssr=np.array([1.0, 0.45, 0.3], F))
    # tail fan
    d = P[-1] - P[-3]
    a0 = np.arctan2(d[1], d[0])
    for da in (-0.5, 0.0, 0.5):
        ln = size * 0.2
        px_, py_ = P[-1] + ln * 0.42 * np.array([np.cos(a0 + da), np.sin(a0 + da)])
        leaf(c, px_, py_, ln, ln * 0.3, a0 + da, band * 0.95, shell * 1.2, curl=0.2, thick=0.012, lift=0.004,
             veins=3, gloss=0.6, mode="lay")


def risotto(c: Canvas):
    plate(c, glaze="#ece6db", well=0.7)
    sl, m, k = mound(c, 0.0, 0.0, 0.61, 0.6, 0.3, height=0.045, power=0.22, edge_wobble=0.045, lump_freq=4,
                     col=hexc("#e7a208"), rough=0.16, coat=0.9, sss=0.8, sssr=np.array([1.0, 0.7, 0.15], F),
                     mode="drape")
    grains = [hexc("#f7cd45"), hexc("#f3bb1c"), hexc("#fbdc7a"), hexc("#eeb010")]
    def where():
        while True:
            a = c.rng.uniform(0, TAU)
            d = np.sqrt(c.rng.uniform(0, 1)) * 0.6
            if d < 0.585 + 0.02 * np.sin(a * 5):
                return d * np.cos(a), d * np.sin(a)
    flecks(c, 5200, where, 0.0125, grains, height=0.011, aspect=(2.0, 2.9), rough=0.26, sss=0.85, coat=0.55,
           jitter=0.15)
    for i, (px_, py_) in enumerate([(-0.3, 0.2), (-0.1, 0.07), (0.1, -0.06), (0.3, -0.19)]):
        prawn(c, px_, py_, -0.72 + 0.05 * i, size=0.5, arc=3.2, flip=1.0)
    # saffron, chives, a little oil
    for _ in range(16):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.05, 0.52)
        px_, py_ = rr * np.cos(a), rr * np.sin(a)
        dr = c.rng.uniform(0, TAU)
        ln = c.rng.uniform(0.04, 0.085)
        P = spline([(px_, py_), (px_ + ln * 0.5 * np.cos(dr) + 0.012, py_ + ln * 0.5 * np.sin(dr)),
                    (px_ + ln * np.cos(dr + 0.4), py_ + ln * np.sin(dr + 0.4))], 12)
        tube(c, P, np.linspace(0.0032, 0.006, 12), hexc("#b3260d"), hk=0.9, mode="drape", rough=0.5, sss=0.5)
    flecks(c, 90, in_disc(c, 0, 0, 0.56), 0.009, [hexc("#4f8f22"), hexc("#3a7418"), hexc("#6aa536")], height=0.008,
           aspect=(1.6, 3.4), rough=0.5, sss=0.4)
    pepper(c, 40, in_disc(c, 0, 0, 0.56))
    for _ in range(10):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.62, 0.66)
        drop(c, rr * np.cos(a), rr * np.sin(a), c.rng.uniform(0.006, 0.016), hexc("#e2a410"), height=0.003, sss=0.8,
             sssr=np.array([1.0, 0.8, 0.2], F))


# ----------------------------------------------------------------------
# 04 beetroot carpaccio
# ----------------------------------------------------------------------
def beet_slice(c: Canvas, cx, cy, r, kind):
    sl, x, y = c.win(cx, cy, r * 1.1)
    d = np.hypot(x - cx, y - cy)
    k = d / (r * (1 + 0.035 * c.noise(sl, 2.5 / r, 2)))
    m = cov((k - 1) * r, c.px)
    wob = 0.5 * c.noise(sl, 3 / r, 2)
    rings = 0.5 + 0.5 * np.cos((k * 5.4 + wob) * TAU)
    if kind == "red":
        cv = mixc(hexc("#6d0d33"), hexc("#a3184c"), rings * 0.7)
        cv = mixc(cv, hexc("#45061f"), sstep(0.93, 0.99, k))
    elif kind == "candy":
        cv = mixc(hexc("#fbe9ef"), hexc("#d42a68"), sstep(0.3, 0.7, rings))
        cv = mixc(cv, hexc("#c2255c"), sstep(0.93, 0.99, k))
    else:
        cv = mixc(hexc("#f0a51c"), hexc("#f8cf5e"), rings * 0.8)
        cv = mixc(cv, hexc("#d9861a"), sstep(0.93, 0.99, k))
    h = 0.011 * sstep(1.0, 0.93, k)
    c.put(sl, m, h=h, mode="drape", col=cv, rough=0.2, coat=0.65, sss=0.9, spec=0.55,
          sssr=np.array([1.0, 0.2, 0.35], F))


def beetroot(c: Canvas):
    plate(c, glaze="#eeeae2", well=0.69)
    kinds = ["red", "candy", "candy", "red", "candy", "gold"]
    n = 13
    for i in range(n):
        a = i / n * TAU
        beet_slice(c, 0.43 * np.cos(a), 0.43 * np.sin(a), 0.168 * c.rng.uniform(0.94, 1.05), kinds[i % 3])
    n = 8
    for i in range(n):
        a = i / n * TAU + 0.3
        beet_slice(c, 0.22 * np.cos(a), 0.22 * np.sin(a), 0.15 * c.rng.uniform(0.94, 1.05), kinds[(i + 1) % 6])
    beet_slice(c, 0.01, -0.01, 0.13, "candy")
    # honey
    for ctrl in ([(-0.5, -0.1), (-0.2, 0.2), (0.1, -0.15), (0.35, 0.2), (0.5, -0.05)],
                 [(-0.3, 0.42), (-0.05, 0.1), (0.2, 0.4), (0.4, 0.3)]):
        P = spline(ctrl, 70)
        tube(c, P, 0.0055 * (0.6 + 0.5 * np.abs(np.sin(np.linspace(0, 9, 70)))), hexc("#e0a21a"), hk=0.5,
             mode="drape", rough=0.04, coat=1.0, sss=0.9, sssr=np.array([1.0, 0.7, 0.15], F))
    for (a, rr, r) in [(0.4, 0.44, 0.052), (1.5, 0.36, 0.047), (2.5, 0.45, 0.05), (3.6, 0.38, 0.046),
                       (4.6, 0.44, 0.05), (5.6, 0.36, 0.045), (0.9, 0.12, 0.042), (3.9, 0.1, 0.04)]:
        dollop(c, rr * np.cos(a), rr * np.sin(a), r)
    for (a, rr, r) in [(0.95, 0.47, 0.058), (2.0, 0.27, 0.052), (3.1, 0.5, 0.055), (4.1, 0.28, 0.05),
                       (5.1, 0.5, 0.056), (0.0, 0.25, 0.05)]:
        walnut(c, rr * np.cos(a), rr * np.sin(a), r, c.rng.uniform(0, TAU))
    for (a, rr) in [(0.15, 0.52), (1.25, 0.5), (2.25, 0.36), (2.85, 0.2), (4.35, 0.52), (5.35, 0.2), (5.9, 0.5)]:
        ln = c.rng.uniform(0.085, 0.115)
        leaf(c, rr * np.cos(a), rr * np.sin(a), ln, ln * 0.4, c.rng.uniform(0, TAU), hexc("#2f7420"),
             hexc("#74b244"), curl=0.6, lift=0.008, q=0.85)
    pepper(c, 50, in_disc(c, 0, 0, 0.58))
    salt(c, 30, in_disc(c, 0, 0, 0.55))


# ----------------------------------------------------------------------
# 05 grilled aubergine
# ----------------------------------------------------------------------
def aubergine(c: Canvas):
    plate(c, glaze="#ede8df", well=0.69)
    sl, m, k = mound(c, 0.0, 0.02, 0.58, 0.52, 0.5, height=0.03, power=0.25, edge_wobble=0.07, lump_freq=3,
                     col=hexc("#eee0c4"), rough=0.32, coat=0.45, sss=0.95, sssr=np.array([1.0, 0.85, 0.7], F),
                     mode="drape")
    x, y = c.X[sl], c.Y[sl]
    sw = np.cos((np.hypot(x, y) * 17 - np.arctan2(y, x) * 1.0) + 2 * c.noise(sl, 2, 2))
    c.h[sl] += 0.006 * sw * (m > 0.9) * sstep(1.0, 0.8, k)
    # olive oil caught in the grooves
    for _ in range(26):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.3, 0.52)
        drop(c, rr * np.cos(a), rr * np.sin(a), c.rng.uniform(0.012, 0.04), hexc("#c9a516"), height=0.003,
             ry=c.rng.uniform(0.008, 0.02), ang=a + np.pi / 2, sss=0.8, sssr=np.array([1.0, 0.85, 0.2], F))
    # the aubergine half
    L, W, ang = 1.1, 0.5, -0.62
    sl, x, y = c.win(0.02, 0.0, 0.62)
    u, v = local(x, y, 0.02, 0.0, ang)
    s = u / L + 0.5
    sc = np.clip(s, 1e-4, 1 - 1e-4)
    w = (W / 2) * np.sin(np.pi * sc ** 0.72) ** 0.6 * (0.42 + 0.58 * sc ** 0.9)
    vv = v - 0.05 * np.sin(np.pi * sc)
    sd = np.abs(vv) - w
    sd = np.where((s < 0) | (s > 1), np.maximum(sd, np.maximum(-s, s - 1) * L), sd)
    m = cov(sd, c.px)
    lat = np.clip(np.abs(vv) / np.maximum(w, 1e-5), 0, 1)
    roast = np.clip(0.45 + 0.9 * c.noise(sl, 3, 3), 0, 1)
    flesh = mixc(hexc("#e2c684"), hexc("#a8702e"), roast * 0.8)
    # scored diamonds
    d1 = np.abs((((u + v) / 0.085) % 1) - 0.5) * 0.085
    d2 = np.abs((((u - v) / 0.085) % 1) - 0.5) * 0.085
    cut = (1 - sstep(0.004, 0.011, np.minimum(d1, d2))) * (lat < 0.78)
    flesh = mixc(flesh, hexc("#5e3a17"), cut * 0.75)
    skin = sstep(0.8, 0.88, lat) + sstep(0.94, 0.975, s)
    sheen_ = 0.5 + 0.5 * c.noise(sl, 4, 2)
    cv = mixc(flesh, mixc(hexc("#2a0d33"), hexc("#5a2a6e"), sheen_ * 0.6), np.clip(skin, 0, 1))
    h = 0.1 * np.clip(1 - lat ** 2.6, 0, 1) ** 0.5 * np.sin(np.pi * sc ** 0.8) ** 0.4 - 0.006 * cut
    h = h * (1 + 0.05 * c.noise(sl, 6, 2))
    c.put(sl, m, h=h, mode="rest", q=0.6, col=cv, rough=0.34 - 0.1 * np.clip(skin, 0, 1),
          coat=0.45 + 0.4 * np.clip(skin, 0, 1), sss=0.6, sssr=np.array([1.0, 0.6, 0.3], F))
    grill(c, sl, m * (lat < 0.76), ang + 1.15, 0.12, 0.03, strength=0.8, depth=0.004)
    # the stalk
    ca, sa = np.cos(ang), np.sin(ang)
    st = np.array([0.02, 0.0]) + np.array([ca, sa]) * (-L / 2)
    P = spline([st + np.array([ca, sa]) * 0.06, st, st - np.array([ca, sa]) * 0.07 + np.array([-sa, ca]) * 0.02], 14)
    tube(c, P, np.linspace(0.075, 0.022, 14), hexc("#566b2a"), hk=0.8, mode="lay", rough=0.6, sss=0.3, coat=0.1)
    for da in (-1.0, -0.35, 0.35, 1.0):
        px_, py_ = st + 0.075 * np.array([np.cos(ang + da), np.sin(ang + da)])
        leaf(c, px_, py_, 0.13, 0.04, ang + da, hexc("#4b5f24"), hexc("#7a8c3a"), curl=0.2, lift=0.01, veins=2,
             gloss=0.1, mode="lay")
    # pomegranate, pine nuts, herbs
    def on_veg():
        while True:
            uu = c.rng.uniform(-0.4, 0.46) * L
            ss = uu / L + 0.5
            ww = (W / 2) * np.sin(np.pi * ss ** 0.72) ** 0.6 * (0.42 + 0.58 * ss ** 0.9) * 0.8
            vvv = c.rng.uniform(-ww, ww) + 0.05 * np.sin(np.pi * ss)
            return 0.02 + uu * ca - vvv * sa, uu * sa + vvv * ca
    for _ in range(17):
        aril(c, *on_veg())
    for _ in range(15):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.25, 0.56)
        aril(c, rr * np.cos(a), rr * np.sin(a))
    for _ in range(11):
        px_, py_ = on_veg() if c.rng.random() < 0.5 else in_disc(c, 0, 0, 0.52, 0.2)()
        drop(c, px_, py_, 0.021, hexc("#e9d6a0") * c.rng.uniform(0.85, 1.05), height=0.014, ry=0.011,
             ang=c.rng.uniform(0, np.pi), mode="lay", rough=0.45, coat=0.2, sss=0.6)
    herbs(c, 70, on_veg, 0.009, cols=("#3f8a2a", "#2e6a1e", "#6cab45"))
    herbs(c, 50, in_disc(c, 0, 0, 0.55), 0.008, cols=("#3f8a2a", "#2e6a1e", "#6cab45"))
    for (lx, ly, ang2) in [(0.2, 0.14, 0.4), (-0.08, -0.14, 2.6), (0.38, -0.32, -0.8), (-0.4, 0.3, 2.2)]:
        leaf(c, lx, ly, 0.1, 0.042, ang2, hexc("#2f7a2a"), hexc("#7cc15a"), serrate=0.12, curl=0.6, lift=0.01, q=0.9)
    flecks(c, 260, in_disc(c, 0.0, 0.0, 0.58), 0.0034, [hexc("#7a1722"), hexc("#a5262b")], height=0.002,
           aspect=(1, 1.4), rough=0.8)


# ----------------------------------------------------------------------
# 06 sea bass
# ----------------------------------------------------------------------
def seabass(c: Canvas):
    plate(c, glaze="#eeeae1", well=0.69)
    sl, m, k = mound(c, 0.0, 0.06, 0.56, 0.47, 0.25, height=0.02, power=0.22, edge_wobble=0.08, lump_freq=3,
                     col=hexc("#f0b136"), rough=0.1, coat=1.0, sss=0.8, sssr=np.array([1.0, 0.7, 0.2], F),
                     mode="drape")
    for _ in range(46):
        a, rr = c.rng.uniform(0, TAU), np.sqrt(c.rng.uniform(0.05, 1)) * 0.47
        drop(c, rr * np.cos(a), 0.06 + rr * np.sin(a) * 0.85, c.rng.uniform(0.007, 0.03), hexc("#5f9320") *
             c.rng.uniform(0.8, 1.2), height=0.003, sss=0.7, sssr=np.array([0.6, 1.0, 0.15], F))
    # wilted greens under the fish
    for i in range(16):
        a = c.rng.uniform(-0.5, 0.5) + 0.35
        px_, py_ = c.rng.uniform(-0.3, 0.3), c.rng.uniform(0.05, 0.3)
        ln = c.rng.uniform(0.18, 0.34)
        P = spline([(px_ - ln * np.cos(a) / 2, py_ - ln * np.sin(a) / 2), (px_ + c.rng.uniform(-0.04, 0.04), py_ +
                    c.rng.uniform(-0.04, 0.04)), (px_ + ln * np.cos(a) / 2, py_ + ln * np.sin(a) / 2)], 20)
        tube(c, P, np.linspace(0.016, 0.006, 20), hexc("#3f7d28") * c.rng.uniform(0.75, 1.2), hk=0.6, mode="lay",
             rough=0.35, coat=0.5, sss=0.5, sssr=np.array([0.4, 1.0, 0.2], F))
    # the fish, lying on its side
    L, W, ang = 1.14, 0.4, -0.42
    cx, cy = -0.07, -0.02
    sl, x, y = c.win(cx, cy, 0.86)
    u, v = local(x, y, cx, cy, ang)
    s = u / L + 0.5                                  # 0 snout .. 1 tail root
    sc = np.clip(s, 1e-4, 1.0)
    w = (W / 2) * np.sin(np.pi * sc ** 0.6) ** 0.85 * (1 - 0.45 * sc ** 2) + 0.03 * sstep(0.7, 1.0, s)
    sd = np.abs(v) - w
    sd = np.where(s < 0, np.maximum(sd, -s * L), sd)
    body = np.where(s > 1, 1.0, sd)
    # tail: a forked fan that opens from the root
    du = u - (0.97 - 0.5) * L
    rho = np.hypot(du, v)
    phi = np.arctan2(v, du)
    rmax = 0.2 * (0.6 + 0.4 * np.clip(np.abs(phi) / 0.66, 0, 1) ** 1.3)
    fin = np.maximum((np.abs(phi) - 0.66) * rho, rho - rmax)
    sdf = np.minimum(body, fin)
    m = cov(sdf, c.px)
    isfin = (fin < body) & (s > 0.985)
    lat = np.clip(v / np.maximum(w, 1e-5), -1, 1)
    nz = c.noise(sl, 3.0, 3)
    silver = mixc(hexc("#6d6a58"), hexc("#ded6c0"), sstep(-0.9, 0.5, lat))
    gold = mixc(silver, hexc("#c08a32"), np.clip(0.6 + 0.6 * nz, 0, 1) * 0.85)
    scales = 0.5 + 0.5 * np.cos(u / 0.016 * TAU) * np.cos((v + u * 0.3) / 0.016 * TAU)
    gold = gold * (0.9 + 0.14 * scales * (s > 0.24))[..., None]
    head = sstep(0.24, 0.19, s)
    cv = mixc(gold, mixc(hexc("#77735f"), hexc("#d5cdb8"), sstep(-0.8, 0.6, lat)), head * 0.85)
    gill = np.exp(-((np.hypot((s - 0.1) * L, v * 0.75) - 0.125) / 0.006) ** 2) * (s > 0.15) * (s < 0.26)
    cv = mixc(cv, hexc("#4a4232"), gill * 0.7)
    mouth = np.exp(-((v - 0.012 - 0.25 * (s * L)) / 0.004) ** 2) * (s < 0.05)
    cv = mixc(cv, hexc("#3a3226"), mouth * 0.7)
    rays = 0.5 + 0.5 * np.cos(phi * 34)
    cv = mixc(cv, hexc("#3f3423") * (0.75 + 0.6 * rays)[..., None], isfin * 1.0)
    hbody = 0.09 * np.clip(1 - np.abs(lat) ** 2.4, 0, 1) ** 0.5 * (np.sin(np.pi * sc ** 0.62) ** 0.5)
    h = np.where(isfin, 0.01 + 0.003 * rays, hbody + 0.004 * scales * (s > 0.24) * (np.abs(lat) < 0.9))
    c.put(sl, m, h=h, mode="rest", q=0.75, col=cv, rough=0.3, coat=0.55, sss=0.4, spec=0.6)
    bodym = m * (~isfin) * (s > 0.25) * (np.abs(lat) < 0.93)
    grill(c, sl, bodym, ang + 1.05, 0.085, 0.022, strength=0.9, depth=0.003)
    grill(c, sl, bodym, ang - 1.05, 0.085, 0.02, strength=0.6, depth=0.002, broken=0.45)
    ca, sa = np.cos(ang), np.sin(ang)
    def at(ss, vv):
        uu = (ss - 0.5) * L
        return cx + uu * ca - vv * sa, cy + uu * sa + vv * ca
    # slashes showing white flesh
    for ss in (0.42, 0.56, 0.7):
        a0, a1 = at(ss - 0.02, -0.07 * (1 - 0.5 * (ss - 0.4))), at(ss + 0.03, 0.06 * (1 - 0.5 * (ss - 0.4)))
        P = spline([a0, ((a0[0] + a1[0]) / 2 + 0.008, (a0[1] + a1[1]) / 2), a1], 14)
        tube(c, P, 0.011 * np.sin(np.linspace(0.2, np.pi - 0.2, 14)), hexc("#f6efe2"), hk=0.3, mode="drape",
             rough=0.45, sss=0.9, coat=0.2)
    # eye, pectoral fin, dorsal edge
    ex, ey = at(0.075, -0.03)
    drop(c, ex, ey, 0.019, hexc("#e3dfd2"), height=0.006, mode="drape", rough=0.2, coat=0.6, sss=0.3)
    drop(c, ex, ey, 0.0095, hexc("#0c0a08"), height=0.004, mode="drape", rough=0.1, coat=1.0, sss=0.0)
    px_, py_ = at(0.32, 0.05)
    leaf(c, px_, py_, 0.14, 0.04, ang + 0.3, hexc("#5a4a2c"), hexc("#9c8862"), curl=0.1, thick=0.006, veins=5,
         gloss=0.3, mode="drape")
    # lemon, tomatoes, capers, herbs
    yel, pith, pulp = hexc("#f2c417"), hexc("#f6efc6"), hexc("#f5d94e")
    citrus(c, 0.3, 0.4, 0.15, yel, pith, pulp, rot=0.4, half=2.2, mode="lay", char=0.55)
    citrus(c, 0.49, 0.22, 0.14, yel, pith, pulp, rot=1.3, half=2.6, mode="lay", char=0.4)
    for (px_, py_, r) in [(-0.34, 0.43, 0.058), (-0.2, 0.5, 0.05), (-0.47, 0.32, 0.048), (0.24, -0.5, 0.05)]:
        sl2, m2, k2 = mound(c, px_, py_, r, height=r * 1.25, power=0.5, col=hexc("#c22a1c"), rough=0.12, coat=1.0,
                            sss=0.9, sssr=np.array([1.0, 0.25, 0.1], F), mode="lay", lumps=0.04, lump_freq=10)
        blister = np.clip(c.noise(sl2, 14, 2) - 0.25, 0, 1) * m2
        c.col[sl2] = mixc(c.col[sl2], hexc("#3b1408"), blister * 0.8)
    for _ in range(12):
        a, rr = c.rng.uniform(0, TAU), c.rng.uniform(0.3, 0.58)
        drop(c, rr * np.cos(a), rr * np.sin(a), c.rng.uniform(0.014, 0.019), hexc("#5d6b24"), height=0.016,
             mode="lay", rough=0.3, coat=0.5, sss=0.5)
    herbs(c, 80, in_disc(c, 0, 0, 0.5), 0.008)
    pepper(c, 40, in_disc(c, 0, 0, 0.5))
    salt(c, 26, lambda: at(c.rng.uniform(0.3, 0.9), c.rng.uniform(-0.09, 0.09)))


# ----------------------------------------------------------------------
# 07 lamb cutlets
# ----------------------------------------------------------------------
def asparagus(c: Canvas, ctrl, r=0.026):
    n = 44
    P = spline(ctrl, n)
    t = np.linspace(0, 1, n)
    R = r * (0.92 + 0.08 * t) * np.where(t > 0.86, 1.12 * np.clip(np.sin(np.clip(1 - t, 0, 1) / 0.14 * np.pi / 2), 0, 1) ** 0.6, 1.0)
    R = np.maximum(R, 0.004)

    def col(tt, v, sl):
        stalk = mixc(hexc("#a8c46c"), hexc("#5e9530"), sstep(0.0, 0.6, tt))
        tip = sstep(0.8, 0.9, tt)
        bracts = 0.5 + 0.5 * np.cos((tt * 26 + np.abs(v) * 0.9) * TAU)
        cvv = mixc(stalk, hexc("#35602a"), tip * (0.55 + 0.4 * bracts))
        cvv = mixc(cvv, hexc("#5b3f5a"), tip * bracts * 0.35)
        node = np.exp(-((((tt * 6.0) % 1) - 0.5) / 0.05) ** 2) * (np.abs(v) < 0.5) * (tt < 0.8)
        cvv = mixc(cvv, hexc("#4d7a2c"), node * 0.6)
        burn = sstep(0.35, 0.9, c.noise(sl, 9, 2) + 0.2)
        return mixc(cvv, hexc("#2a1c0d"), burn * 0.55)

    tube(c, P, R, col, hk=0.95, mode="lay", span=0.05, rough=0.38, coat=0.45, sss=0.5,
         sssr=np.array([0.4, 1.0, 0.2], F))


def chop(c: Canvas, cx, cy, ang, sz=1.0):
    """A cutlet, cut face up, with its cleaned bone pointing along `ang`."""
    ca, sa = np.cos(ang), np.sin(ang)
    # bone first so the meat sits over its root
    b0 = np.array([cx, cy]) + np.array([ca, sa]) * 0.08 * sz
    b1 = b0 + np.array([ca, sa]) * 0.43 * sz
    mid = (b0 + b1) / 2 + np.array([-sa, ca]) * 0.028 * sz
    P = spline([b0, mid, b1], 30)
    t = np.linspace(0, 1, 30)
    R = sz * (0.03 - 0.008 * t + 0.006 * np.exp(-((t - 1) / 0.08) ** 2))

    def bone(tt, v, sl):
        base = mixc(hexc("#8f5d33"), hexc("#efe2c8"), sstep(0.0, 0.35, tt))
        base = mixc(base, hexc("#b88b55"), sstep(0.86, 1.0, tt) * 0.6)
        return base * (0.9 + 0.16 * c.noise(sl, 16, 2))[..., None]

    tube(c, P, R, bone, hk=0.85, mode="lay", span=0.06, rough=0.45, coat=0.2, sss=0.4)
    a, b = 0.16 * sz, 0.125 * sz
    sl, x, y = c.win(cx, cy, a * 1.45)
    u, v = local(x, y, cx, cy, ang)
    k = np.sqrt((u / a) ** 2 + (v / b) ** 2) * (1 + 0.05 * c.noise(sl, 4, 2))
    kf = np.sqrt(((u + 0.012 * sz) / (a * 1.13)) ** 2 + ((v + 0.03 * sz) / (b * 1.22)) ** 2)
    kf = kf * (1 + 0.05 * c.noise(sl, 5, 2))
    mf = cov((kf - 1) * b, c.px)
    fatc = mixc(hexc("#f3e3c2"), hexc("#c58d3a"), np.clip(0.4 + c.noise(sl, 7, 2), 0, 1) * 0.8)
    hf = 0.062 * sz * np.clip(1 - kf ** 4, 0, 1) ** 0.45
    c.put(sl, mf, h=hf, mode="rest", q=0.6, col=fatc, rough=0.32, coat=0.5, sss=0.8,
          sssr=np.array([1.0, 0.7, 0.4], F))
    m = cov((k - 1) * b, c.px)
    fibre = c.noise(sl, 12, 3)
    rosy = mixc(hexc("#bd4f5b"), hexc("#a23e4a"), np.clip(0.5 + fibre, 0, 1))
    cv = mixc(rosy, hexc("#7e3330"), sstep(0.5, 0.8, k))
    cv = mixc(cv, hexc("#3f1d10"), sstep(0.78, 0.95, k))
    sear = np.clip(c.noise(sl, 5, 3) + 0.1, 0, 1) * sstep(0.7, 0.95, k)
    cv = mixc(cv, hexc("#2a140b"), sear * 0.6)
    h = 0.07 * sz * np.clip(1 - k ** 5, 0, 1) ** 0.45 * (1 + 0.04 * fibre)
    c.put(sl, m, h=h, mode="rest", q=0.3, col=cv, rough=0.34, coat=0.45, sss=0.8,
          sssr=np.array([1.0, 0.3, 0.25], F))


def lamb(c: Canvas):
    plate(c, glaze="#ece6dc", well=0.68)
    # pea and mint puree
    P = spline([(0.48, 0.02), (0.4, 0.3), (0.16, 0.46), (-0.14, 0.47), (-0.38, 0.33)], 60)
    t = np.linspace(0, 1, 60)
    smear(c, P, 0.13 * (1 - t) ** 0.6 * sstep(0, 0.07, t) + 0.02, hexc("#7fa62e"), thick=0.024, grooves=6,
          rough=0.3, coat=0.4, sss=0.7, sssr=np.array([0.5, 1.0, 0.2], F))
    # jus
    sl, m, k = mound(c, -0.2, 0.05, 0.3, 0.24, 0.6, height=0.012, power=0.2, edge_wobble=0.12, lump_freq=4,
                     col=hexc("#3a0c0c"), rough=0.05, coat=1.0, sss=0.5, sssr=np.array([1.0, 0.2, 0.1], F),
                     mode="drape")
    for (px_, py_, r) in [(-0.5, -0.1, 0.03), (-0.46, -0.22, 0.016), (-0.52, 0.2, 0.02), (-0.36, -0.36, 0.012),
                          (0.02, 0.3, 0.02)]:
        drop(c, px_, py_, r, hexc("#3a0c0c"), rough=0.05, sss=0.5, sssr=np.array([1.0, 0.2, 0.1], F))
    for i, off in enumerate((-0.09, -0.03, 0.03, 0.09)):
        asparagus(c, [(-0.5 + 0.02 * i, 0.3 + off), (-0.2, 0.12 + off + 0.02 * np.sin(i)), (0.12, -0.12 + off),
                      (0.42, -0.4 + off * 0.8)], r=0.026 * c.rng.uniform(0.9, 1.08))
    for (px_, py_, ang, sz) in [(-0.22, -0.02, -1.02, 1.0), (-0.03, 0.1, -0.86, 1.04), (0.17, 0.2, -0.7, 0.98)]:
        chop(c, px_, py_, ang, sz)
    # rosemary
    stem = spline([(-0.3, -0.34), (-0.12, -0.3), (0.06, -0.33), (0.2, -0.27)], 30)
    tube(c, stem, 0.006, hexc("#5a4a2a"), hk=0.9, mode="lay", rough=0.7)
    for i in range(3, 29):
        d = stem[min(i + 1, 29)] - stem[i - 1]
        a0 = np.arctan2(d[1], d[0])
        for sgn in (-1, 1):
            a = a0 + sgn * c.rng.uniform(0.7, 1.15)
            ln = c.rng.uniform(0.05, 0.075) * (1 - 0.4 * (i / 29) ** 3)
            px_, py_ = stem[i] + ln * 0.5 * np.array([np.cos(a), np.sin(a)])
            leaf(c, px_, py_, ln, 0.0075, a, hexc("#3f5f33"), hexc("#7d9a6a"), curl=0.0, thick=0.006, veins=0,
                 gloss=0.1, mode="lay", tip=0.5)
    salt(c, 40, in_disc(c, 0, 0.08, 0.3))
    pepper(c, 60, in_disc(c, 0, 0, 0.55))
    herbs(c, 30, in_disc(c, 0, 0, 0.5), 0.007)


DISHES = {
    "burrata": (burrata, dict(seed=3)),
    "octopus": (octopus, dict(seed=5)),
    "risotto": (risotto, dict(seed=8)),
    "beetroot": (beetroot, dict(seed=13)),
    "aubergine": (aubergine, dict(seed=21)),
    "seabass": (seabass, dict(seed=34)),
    "lamb": (lamb, dict(seed=55)),
    "tart": (tart, dict(seed=11)),
}

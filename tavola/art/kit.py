"""2-D authoring kit: every plate is drawn as a height field plus material maps.

Coordinates are normalised so the plate (or the cut-out) spans [-1, 1] in x and
y, with y pointing DOWN like an image. Heights use the same unit, so a plate of
radius 1 with a 0.09-high rim is a 27 cm plate with a 12 mm rim. Colours are
linear-light RGB. cyc.py turns the result into a lit, path-traced picture.
"""
from __future__ import annotations

import numpy as np
from scipy import ndimage as ndi
from scipy.interpolate import splev, splprep

F = np.float32
TAU = float(np.pi * 2)


def hexc(s: str) -> np.ndarray:
    """'#rrggbb' (sRGB) -> linear-light RGB."""
    s = s.lstrip("#")
    v = np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], F) / 255
    return (v ** 2.2).astype(F)


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def cov(sd, px):
    """Signed distance -> anti-aliased coverage."""
    return np.clip(0.5 - sd / px, 0.0, 1.0).astype(F)


def mixc(a, b, t):
    t = np.asarray(t, F)[..., None]
    return (np.asarray(a, F) * (1 - t) + np.asarray(b, F) * t).astype(F)


def spline(pts, n: int = 48) -> np.ndarray:
    pts = np.asarray(pts, float)
    tck, _ = splprep(pts.T, s=0, k=min(3, len(pts) - 1))
    return np.stack(splev(np.linspace(0, 1, n), tck), -1)


def local(x, y, cx, cy, ang):
    """Rotate into a frame at (cx, cy): u runs along `ang`, v across it."""
    c, s = np.cos(ang), np.sin(ang)
    dx, dy = x - cx, y - cy
    return dx * c + dy * s, -dx * s + dy * c


def sd_ellipse(u, v, a, b):
    k = np.sqrt((u / a) ** 2 + (v / b) ** 2)
    return (k - 1) * min(a, b)


class Canvas:
    def __init__(self, n: int, seed: int = 7):
        self.n = n
        self.px = 2.0 / n
        xs = (np.arange(n, dtype=F) + 0.5) / n * 2 - 1
        self.X, self.Y = np.meshgrid(xs, xs)
        self.h = np.zeros((n, n), F)
        self.col = np.zeros((n, n, 3), F)
        self.rough = np.full((n, n), 0.5, F)
        self.sss = np.zeros((n, n), F)
        self.coat = np.zeros((n, n), F)
        self.spec = np.full((n, n), 0.5, F)
        self.sheen = np.zeros((n, n), F)
        self.alpha = np.zeros((n, n), F)
        self.sssr = np.tile(np.array([1.0, 0.45, 0.25], F), (n, n, 1))
        self.rng = np.random.default_rng(seed)

    # ---- windows -------------------------------------------------------
    def box(self, x0, y0, x1, y1):
        n = self.n
        j0 = int(np.clip(np.floor((x0 + 1) * n / 2) - 1, 0, n))
        j1 = int(np.clip(np.ceil((x1 + 1) * n / 2) + 1, 0, n))
        i0 = int(np.clip(np.floor((y0 + 1) * n / 2) - 1, 0, n))
        i1 = int(np.clip(np.ceil((y1 + 1) * n / 2) + 1, 0, n))
        sl = (slice(i0, i1), slice(j0, j1))
        return sl, self.X[sl], self.Y[sl]

    def win(self, cx, cy, r):
        return self.box(cx - r, cy - r, cx + r, cy + r)

    def full(self):
        return (slice(None), slice(None)), self.X, self.Y

    # ---- noise ---------------------------------------------------------
    def noise(self, sl, freq: float, octaves: int = 1, gain: float = 0.5):
        """Smooth noise, roughly in [-1, 1]. `freq` = features per unit length."""
        shp = self.h[sl].shape
        if shp[0] == 0 or shp[1] == 0:
            return np.zeros(shp, F)
        out = np.zeros(shp, F)
        amp = 1.0
        for o in range(octaves):
            f = freq * 2 ** o
            cy = max(1.0, shp[0] * self.px * f)
            cx = max(1.0, shp[1] * self.px * f)
            g = self.rng.standard_normal((int(np.ceil(cy)) + 3, int(np.ceil(cx)) + 3)).astype(F)
            yy = np.linspace(1, 1 + cy, shp[0], dtype=F)
            xx = np.linspace(1, 1 + cx, shp[1], dtype=F)
            # separable cubic resampling: rows then columns
            a = ndi.map_coordinates(g, np.meshgrid(yy, np.arange(g.shape[1], dtype=F), indexing="ij"), order=3, mode="nearest")
            b = ndi.map_coordinates(a, np.meshgrid(np.arange(shp[0], dtype=F), xx, indexing="ij"), order=3, mode="nearest")
            out += amp * b
            amp *= gain
        return (out / (out.std() + 1e-6) * 0.5).astype(F)

    def blur(self, a, radius: float):
        """Gaussian blur with the radius given in plate units."""
        return ndi.gaussian_filter(a, radius / self.px).astype(F)

    # ---- compositing ---------------------------------------------------
    def put(self, sl, m, h=None, mode="drape", q=0.8, z=None, col=None, sssr=None,
            rough=None, sss=None, coat=None, spec=None, sheen=None, alpha=False, span=0.04, sink=0.0):
        """Lay a shape down. `m` is coverage; `h` is its own thickness profile.

        drape: the shape follows whatever is underneath (sauces, slices, leaves)
        rest:  a rigid body sits on the high points under its footprint
        lay:   a long body rides the terrain, bridging gaps narrower than `span`
        set:   absolute height `z + h`
        """
        m = np.clip(m, 0, 1).astype(F)
        if m.size == 0 or float(m.max()) <= 0:
            return
        if h is not None:
            H = self.h[sl]
            if mode == "drape":
                H += (h * (m > 0)).astype(F)
            elif mode == "rest":
                core = m > 0.5
                base = float(np.quantile(H[core], q)) if core.any() else 0.0
                H[...] = np.where(m > 0.05, np.maximum(H, base + h), H)
            elif mode == "lay":
                k = max(3, int(round(span / self.px)))
                base = ndi.gaussian_filter(ndi.maximum_filter(H, size=k), k * 0.5)
                H[...] = np.where(m > 0.05, np.maximum(H, base + h - sink), H)
            elif mode == "set":
                H[...] = H * (1 - m) + (float(z or 0) + h) * m
        for name, v in (("col", col), ("sssr", sssr)):
            if v is not None:
                a = getattr(self, name)[sl]
                a[...] = a * (1 - m[..., None]) + np.asarray(v, F) * m[..., None]
        for name, v in (("rough", rough), ("sss", sss), ("coat", coat), ("spec", spec), ("sheen", sheen)):
            if v is not None:
                a = getattr(self, name)[sl]
                a[...] = a * (1 - m) + np.asarray(v, F) * m
        if alpha:
            a = self.alpha[sl]
            a[...] = np.maximum(a, m)

    def maps(self) -> dict:
        return dict(h=self.h, col=np.clip(self.col, 0, 1), rough=np.clip(self.rough, 0.02, 1),
                    sss=np.clip(self.sss, 0, 1), coat=np.clip(self.coat, 0, 1), spec=np.clip(self.spec, 0, 1),
                    sheen=np.clip(self.sheen, 0, 1), alpha=np.clip(self.alpha, 0, 1), sssr=self.sssr)

    # ---- curves --------------------------------------------------------
    def curve(self, P, R, pad: float = 0.0):
        """Field around a polyline with per-vertex radius.

        Returns (sl, sd, d, r, t, side): signed distance to the swept shape,
        distance to the axis, the radius there, 0..1 along the curve, and
        which side of the axis the pixel lies on (-1 / +1).
        """
        P = np.asarray(P, float)
        R = np.broadcast_to(np.asarray(R, float), (len(P),)).copy()
        rm = float(R.max()) + pad + 2 * self.px
        sl, x, y = self.box(P[:, 0].min() - rm, P[:, 1].min() - rm, P[:, 0].max() + rm, P[:, 1].max() + rm)
        best = np.full(x.shape, 1e9, F)
        D = np.zeros(x.shape, F)
        RR = np.zeros(x.shape, F)
        T = np.zeros(x.shape, F)
        S = np.ones(x.shape, F)
        seg = np.hypot(*np.diff(P, axis=0).T)
        cum = np.concatenate([[0.0], np.cumsum(seg)])
        L = cum[-1] + 1e-9
        i0, j0 = sl[0].start, sl[1].start
        n = self.n
        for k in range(len(P) - 1):
            ax, ay = P[k]
            bx, by = P[k + 1]
            r = max(R[k], R[k + 1]) + pad + 2 * self.px
            a0 = int(np.clip(np.floor((min(ay, by) - r + 1) * n / 2), 0, n)) - i0
            a1 = int(np.clip(np.ceil((max(ay, by) + r + 1) * n / 2) + 1, 0, n)) - i0
            b0 = int(np.clip(np.floor((min(ax, bx) - r + 1) * n / 2), 0, n)) - j0
            b1 = int(np.clip(np.ceil((max(ax, bx) + r + 1) * n / 2) + 1, 0, n)) - j0
            a0, b0 = max(a0, 0), max(b0, 0)
            if a1 <= a0 or b1 <= b0:
                continue
            w = (slice(a0, a1), slice(b0, b1))
            xx, yy = x[w], y[w]
            ex, ey = bx - ax, by - ay
            tt = np.clip(((xx - ax) * ex + (yy - ay) * ey) / (ex * ex + ey * ey + 1e-12), 0, 1)
            dx = xx - (ax + tt * ex)
            dy = yy - (ay + tt * ey)
            d = np.hypot(dx, dy)
            rr = R[k] + (R[k + 1] - R[k]) * tt
            sc = d - rr
            up = sc < best[w]
            best[w] = np.where(up, sc, best[w])
            D[w] = np.where(up, d, D[w])
            RR[w] = np.where(up, rr, RR[w])
            T[w] = np.where(up, (cum[k] + tt * seg[k]) / L, T[w])
            S[w] = np.where(up, np.where(ex * dy - ey * dx >= 0, 1.0, -1.0), S[w])
        return sl, best, D, RR, T, S


# ======================================================================
# reusable pieces
# ======================================================================
def tube(c: Canvas, P, R, col, hk: float = 1.0, mode: str = "lay", q: float = 0.8, flat: float = 0.0,
         bump=None, **mat):
    """A rounded body swept along a curve. `col` may be a function of (t, v, sl)
    where v = signed lateral position in [-1, 1]."""
    sl, sd, d, r, t, side = c.curve(P, R)
    m = cov(sd, c.px)
    u = np.clip(d / np.maximum(r, 1e-6), 0, 1)
    prof = np.sqrt(np.clip(1 - u * u, 0, 1))
    if flat > 0:
        prof = np.minimum(prof, 1 - flat) / (1 - flat)
    h = hk * r * prof
    if bump is not None:
        h = h + bump(t, u * side, sl) * (m > 0.5)
    cv = col(t, u * side, sl) if callable(col) else col
    c.put(sl, m, h=h, mode=mode, q=q, col=cv, **mat)
    return sl, m, t, u * side


def mound(c: Canvas, cx, cy, rx, ry=None, ang=0.0, height=0.1, col=None, power=0.5, lumps=0.0, lump_freq=6.0,
          mode="rest", q=0.8, edge_wobble=0.0, **mat):
    """Soft dome (cheese, potato, purée): an ellipse with an optional lumpy edge and top."""
    ry = ry or rx
    r = max(rx, ry) * (1.2 + edge_wobble)
    sl, x, y = c.win(cx, cy, r)
    u, v = local(x, y, cx, cy, ang)
    k = np.sqrt((u / rx) ** 2 + (v / ry) ** 2)
    if edge_wobble:
        k = k * (1 + edge_wobble * c.noise(sl, lump_freq * 0.7, 2))
    m = cov((k - 1) * min(rx, ry), c.px)
    h = height * np.clip(1 - k * k, 0, 1) ** power
    if lumps:
        h = h * (1 + lumps * c.noise(sl, lump_freq, 3))
    c.put(sl, m, h=h, mode=mode, q=q, col=col, **mat)
    return sl, m, k


def drop(c: Canvas, cx, cy, r, col, height=None, ry=None, ang=0.0, mode="drape", rough=0.06, coat=1.0,
         sss=0.4, spec=0.6, **mat):
    """A bead of oil, sauce or honey."""
    ry = ry or r
    sl, x, y = c.win(cx, cy, max(r, ry) * 1.15 + 2 * c.px)
    u, v = local(x, y, cx, cy, ang)
    k = np.sqrt((u / r) ** 2 + (v / ry) ** 2)
    m = cov((k - 1) * min(r, ry), c.px)
    h = (height if height is not None else 0.35 * min(r, ry)) * np.clip(1 - k * k, 0, 1) ** 0.6
    c.put(sl, m, h=h, mode=mode, col=col, rough=rough, coat=coat, sss=sss, spec=spec, **mat)


def flecks(c: Canvas, n, where, size, cols, height=0.004, aspect=(1.0, 2.2), rough=0.6, sss=0.2, coat=0.0,
           mode="drape", jitter=0.25):
    """Scatter small bits (herbs, pepper, crumbs, zest). `where` returns a point per call."""
    cols = [np.asarray(k, F) for k in cols]
    for _ in range(n):
        cx, cy = where()
        s = size * (1 + jitter * c.rng.uniform(-1, 1))
        asp = c.rng.uniform(*aspect)
        ang = c.rng.uniform(0, np.pi)
        a, b = s * np.sqrt(asp), s / np.sqrt(asp)
        sl, x, y = c.win(cx, cy, a + 2 * c.px)
        u, v = local(x, y, cx, cy, ang)
        k = np.sqrt((u / a) ** 2 + (v / b) ** 2)
        m = cov((k - 1) * b, c.px)
        col = cols[c.rng.integers(len(cols))] * c.rng.uniform(0.8, 1.15)
        c.put(sl, m, h=height * np.clip(1 - k * k, 0, 1) ** 0.5, mode=mode, col=col, rough=rough, sss=sss, coat=coat)


def in_disc(c: Canvas, cx, cy, r, rin=0.0):
    def f():
        a = c.rng.uniform(0, TAU)
        d = np.sqrt(c.rng.uniform((rin / r) ** 2 if r else 0, 1)) * r
        return cx + d * np.cos(a), cy + d * np.sin(a)
    return f


def leaf(c: Canvas, cx, cy, length, width, ang, col, col2=None, curl=0.5, thick=0.006, serrate=0.0, lift=0.0,
         mode="rest", q=0.7, veins=7, gloss=0.5, tip=1.0, **mat):
    """A single leaf seen from above. `ang` points from stem to tip."""
    col2 = col2 if col2 is not None else np.asarray(col) * 1.5
    sl, x, y = c.win(cx, cy, length * 0.62 + 2 * c.px)
    u, v = local(x, y, cx, cy, ang)
    s = u / length + 0.5                       # 0 at the stem, 1 at the tip
    sc = np.clip(s, 1e-4, 1 - 1e-4)
    w = width * 1.9 * (sc ** 0.62) * ((1 - sc) ** (0.5 * tip))
    if serrate:
        w = w * (1 + serrate * np.abs(np.sin(s * np.pi * 9)) - serrate * 0.5)
    bend = 0.06 * length * np.sin(s * np.pi) * c.rng.uniform(-1, 1)
    vv = v - bend
    sd = np.abs(vv) - w
    sd = np.where((s < 0) | (s > 1), np.maximum(sd, np.maximum(-s, s - 1) * length), sd)
    m = cov(sd, c.px)
    lat = np.clip(np.abs(vv) / np.maximum(w, 1e-5), 0, 1)
    rib = np.exp(-(vv / (0.035 * width + c.px)) ** 2)
    vein = 0.5 + 0.5 * np.cos((s * veins - lat * 1.4) * TAU)
    vein = vein ** 6 * (1 - lat) ** 0.3
    h = thick + lift + curl * width * 0.5 * (lat ** 2) * (0.6 + 0.4 * np.sin(s * np.pi)) + 0.3 * thick * (1 - vein) - 0.6 * thick * rib
    shade = 0.82 + 0.25 * c.noise(sl, 9 / length, 2)
    cv = mixc(col, col2, np.clip(0.55 * rib + 0.3 * vein, 0, 1)) * shade[..., None]
    c.put(sl, m, h=h, mode=mode, q=q, col=cv, rough=0.5 - 0.3 * gloss, coat=gloss, sss=0.5,
          sssr=np.array([0.3, 1.0, 0.2], F), **mat)


def plate(c: Canvas, glaze="#ebe5da", rim="#b08a5f", well=0.67, rise=0.075, speckle=1.0, rim_line=1.0,
          base=0.03, tint=None):
    """A hand-thrown stoneware plate that fills the canvas edge to edge."""
    sl, X, Y = c.full()
    R = np.hypot(X, Y)
    z = base + rise * sstep(well, 0.955, R) ** 0.85
    z = z - 0.006 * (1 - sstep(0.0, well, R)) * 0  # dead flat well
    lip = np.sqrt(np.clip(1 - np.clip((R - 0.965) / 0.035, 0, 1) ** 2, 0, 1))
    z = z * lip
    c.h[...] = z.astype(F)
    g = hexc(glaze)
    col = np.ones((c.n, c.n, 3), F) * g
    big = c.noise(sl, 1.6, 3)
    col *= (1 + 0.035 * big)[..., None]
    # glaze pools slightly where the well turns up
    pool = np.exp(-((R - (well + 0.03)) / 0.035) ** 2)
    col *= (1 - 0.05 * pool)[..., None]
    if speckle:
        sp = (c.rng.random((c.n, c.n)) > 1 - 0.0011 * speckle * (1200 / c.n) ** 2).astype(F)
        sp = ndi.gaussian_filter(sp, max(0.55, 0.0011 / c.px))
        sp = np.clip(sp / (sp.max() + 1e-6) * 2.2, 0, 1)
        col = mixc(col, hexc("#6b4a30"), sp * 0.75)
    if rim_line:
        wob = 0.006 * c.noise(sl, 5, 2)
        edge = sstep(0.95 + wob, 0.975 + wob, R) * rim_line
        col = mixc(col, hexc(rim), edge * (0.75 + 0.25 * c.noise(sl, 14, 2)))
    if tint is not None:
        col *= np.asarray(tint, F)
    c.col[...] = col
    c.rough[...] = 0.2 + 0.08 * (big > 0)
    c.coat[...] = 0.55
    c.spec[...] = 0.5
    c.sss[...] = 0.0
    c.alpha[...] = np.clip((0.9985 - R) / c.px + 0.5, 0, 1)
    c.rough[...] = np.where(R > 0.958, 0.55, c.rough)
    c.coat[...] = np.where(R > 0.958, 0.1, c.coat)
    return R


def smear(c: Canvas, P, W, col, thick=0.02, grooves=8.0, ragged=0.1, **mat):
    """A spoon swoosh of puree along a curve. W is the half-width per vertex."""
    sl, sd, d, r, t, side = c.curve(P, np.asarray(W) * (1 + ragged))
    edge = 1 + ragged * c.noise(sl, 8, 2)
    v = d / np.maximum(r / (1 + ragged) * edge, 1e-6)
    m = cov((v - 1) * r, c.px) * (sd < 1e8)
    g = 0.5 + 0.5 * np.cos(v * side * grooves * np.pi + 2.2 * c.noise(sl, 2.5, 2))
    h = thick * np.clip(1 - v ** 4, 0, 1) ** 0.7 * (0.5 + 0.5 * g)
    cv = col(t, v * side, sl) if callable(col) else np.asarray(col, F) * (0.92 + 0.12 * g)[..., None]
    c.put(sl, m, h=h, mode="drape", col=cv, **mat)
    return sl, m


def citrus(c: Canvas, cx, cy, r, rind, pith, pulp, segs=10, thick=0.022, rot=0.0, half=None, mode="drape",
           char=0.0, alpha=False, q=0.8):
    """A wheel of lemon or orange. `half` = angle of the cut for a half-moon."""
    rind, pith, pulp = (np.asarray(k, F) for k in (rind, pith, pulp))
    sl, x, y = c.win(cx, cy, r * 1.08)
    dx, dy = x - cx, y - cy
    d = np.hypot(dx, dy)
    th = np.arctan2(dy, dx) + rot
    k = d / r * (1 + 0.012 * c.noise(sl, 3 / r, 1))
    sd = (k - 1) * r
    if half is not None:
        sd = np.maximum(sd, -(dx * np.cos(half) + dy * np.sin(half)))
    m = cov(sd, c.px)
    seg = np.abs(((th / TAU * segs) % 1) - 0.5) * 2
    memb = np.maximum(sstep(0.80, 0.93, seg + 0.25 * (0.3 - k)), sstep(0.76, 0.80, k))
    memb = np.maximum(memb, sstep(0.10, 0.05, k))
    ves = 0.5 + 0.5 * np.cos(th * segs * 7 + 9 * c.noise(sl, 10 / r, 2))
    juice = pulp * (0.78 + 0.3 * ves * sstep(0.1, 0.5, k))[..., None]
    cv = mixc(juice, pith, memb)
    cv = mixc(cv, rind, sstep(0.885, 0.915, k))
    if char:
        burn = np.clip(c.noise(sl, 2.5 / r, 3) + char - 0.5, 0, 1)
        cv = mixc(cv, hexc("#5a3413"), burn * 0.85)
    h = thick * sstep(1.0, 0.95, k) * (1 - 0.18 * (1 - memb) * (k < 0.8))
    wet = (1 - memb) * (k < 0.8)
    c.put(sl, m, h=h, mode=mode, q=q, col=cv, rough=0.45 - 0.3 * wet, coat=0.2 + 0.6 * wet, sss=0.9, spec=0.5,
          sssr=np.clip(pulp * 1.4, 0.1, 1), alpha=alpha)
    return sl, m


def grill(c: Canvas, sl, mask, ang, spacing, width, strength=0.85, col="#1c0f0a", depth=0.004, wob=0.5,
          broken=0.25):
    """Char lines pressed into whatever is under `mask`."""
    x, y = c.X[sl], c.Y[sl]
    u = x * np.cos(ang) + y * np.sin(ang)
    ph = (u / spacing + wob * 0.2 * c.noise(sl, 2.0, 2)) % 1.0
    dl = np.abs(ph - 0.5) * spacing
    line = 1 - sstep(width * 0.25, width * 0.6, dl)
    inten = sstep(-0.5 + broken, 0.3 + broken, c.noise(sl, 5, 2) + 0.3)
    a = (mask * line * inten * strength).astype(F)
    c.col[sl] = mixc(c.col[sl], hexc(col), a)
    c.rough[sl] = c.rough[sl] * (1 - a) + 0.75 * a
    c.coat[sl] = c.coat[sl] * (1 - 0.8 * a)
    c.h[sl] -= depth * a
    return a

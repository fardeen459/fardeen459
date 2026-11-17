"use client";

/* eslint-disable @next/next/no-img-element -- the plates are bare <img> layers the compositor moves; next/image would wrap them */

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  asset,
  brand,
  burstSpots,
  dishes,
  ingredients,
  loose,
  nav,
  TABLE,
} from "@/config";

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const N = dishes.length;
const STEP = 360 / N;
const { size: SIZE, ring: RING, plate: PLATE, boost: BOOST } = TABLE;
const HALF = SIZE / 2;

/** must match the `wide` variant in globals.css */
const WIDE_QUERY = "(min-width: 860px) and (min-aspect-ratio: 21/20)";
/** phones: must match the `max-width: 767.98px` block in globals.css. 768 px and up is untouched. */
const MOBILE_QUERY = "(max-width: 767.98px)";
/** phones: opening and closing a dish is one short compositor transition */
const CAM_MS = 300;
const CAM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const onPhone = () =>
  typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
const subscribeMobile = (onChange: () => void) => {
  const q = window.matchMedia(MOBILE_QUERY);
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
};
/** height of the phone sheet as a share of the hero; matches `.detail` */
const SHEET = 0.58;
/** left alone, the table steps on */
const AUTO_MS = 5000;
/** how far the opening spins the table before it rests on the first dish */
const INTRO_SPIN = -150;
const INTRO_HOLD = 0.3;
const INTRO_GLIDE = 2.5;
/** spring that carries `pos` to `target` (critically damped) */
const OMEGA = 6.2;
/** shadow offsets on screen, in table units: the light sits upper left */
const PLATE_SHADOW = { x: 34, y: 48, scale: 1.25 };
const LOOSE_SHADOW = { x: 10, y: 14 };

type Cam = { x: number; y: number; s: number };
type ViewName = "overview" | "browse" | "detail";
type Layout = { wide: boolean; front: number } & Record<ViewName, Cam>;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const mod = (v: number, n: number) => ((v % n) + n) % n;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);
const pad = (n: number) => String(n).padStart(2, "0");
/** shortest signed way round the table from one dish to another */
const wrap = (d: number) => {
  const m = mod(d, N);
  return m > N / 2 ? m - N : m;
};

/**
 * The three camera views. Each is where the centre of the table sits on
 * screen and how many pixels one table unit is worth. `front` is the angle
 * (clockwise from 12 o'clock) at which the chosen plate comes to rest.
 */
/** On a phone: where the table's square slot sits in the stage (centre and diameter). */
type Slot = { x: number; y: number; d: number };

function computeLayout(
  W: number,
  H: number,
  wide: boolean,
  slot?: Slot,
): Layout {
  const dia = PLATE * (1 + BOOST);
  if (slot && !wide) {
    // Phone: the whole table fits its slot under the nav, so every plate on
    // the ring stays in view (the ring is 35% of the table's width).
    const sB = slot.d / SIZE;
    // Open: the front plate and its four fly-out ingredients fill the slot.
    const sD = slot.d / 960;
    return {
      wide: false,
      front: 0,
      overview: { x: slot.x, y: slot.y, s: sB * 0.8 },
      browse: { x: slot.x, y: slot.y, s: sB },
      detail: { x: slot.x, y: slot.y + RING * sD, s: sD },
    };
  }
  if (wide) {
    // The table is pushed down and to the right: the front plate rests at
    // about 11 o'clock and the left third of the screen stays dark floor.
    const front = -30;
    const rad = (front * Math.PI) / 180;
    const ux = Math.sin(rad);
    const uy = -Math.cos(rad);
    const sB = clamp(Math.min(H * 0.00088, W * 0.00064), 0.22, 1.6);
    const sD = sB * 1.14;
    return {
      wide,
      front,
      overview: {
        x: W * 0.5,
        y: H * 0.5 + 30,
        s: Math.min(W * 0.9, (H - 92) * 0.97) / SIZE,
      },
      browse: {
        x: W * 0.62 - ux * RING * sB,
        y: H * 0.53 - uy * RING * sB,
        s: sB,
      },
      detail: {
        x: W * 0.655 - ux * RING * sD,
        y: H * 0.515 - uy * RING * sD,
        s: sD,
      },
    };
  }
  // Phone: the plate sits near the top, the table hangs below the middle of
  // the screen and the neighbours peek in from both sides.
  // On a tablet held upright the camera stands further back: the front plate
  // takes half the width instead of three quarters, so more of the table shows.
  // Phones (480 px and narrower) are unchanged; between, it eases from one to the other.
  const far = clamp((W - 480) / 320, 0, 1);
  const sB = clamp(
    Math.min((W * (0.74 - 0.24 * far)) / dia, (H * (0.37 - 0.07 * far)) / dia),
    0.18,
    1.2,
  );
  const yB = Math.max(70 + (dia * sB) / 2 + 10, H * 0.3);
  // Open: the plate shrinks to sit, with its ingredients, above the sheet.
  const room = H * (1 - SHEET) - 58;
  const sD = clamp(Math.min(W / 880, room / 900), 0.14, sB);
  const yD = 58 + room * 0.5;
  return {
    wide,
    front: 0,
    overview: { x: W / 2, y: H * 0.45, s: (W * 0.94) / SIZE },
    browse: { x: W / 2, y: yB + RING * sB, s: sB },
    detail: { x: W / 2, y: yD + RING * sD, s: sD },
  };
}

type Drag = {
  id: number;
  touch: boolean;
  /** first contact, to tell a turn from a page scroll */
  sx: number;
  sy: number;
  /** last position */
  x: number;
  y: number;
  active: boolean;
};

type Engine = {
  /** which dish should be at the front; fractional while dragging */
  target: number;
  /** eases toward target; the table's rotation comes from this */
  pos: number;
  vel: number;
  cam: Cam;
  from: Cam;
  to: Cam;
  camT: number;
  camDur: number;
  view: ViewName;
  layout: Layout;
  /** opening: 0 → 1, or -1 when it is not running */
  intro: number;
  spin: number;
  ready: boolean;
  copyShown: boolean;
  open: boolean;
  reduced: boolean;
  onScreen: boolean;
  /** pointer or focus is resting on the controls: do not turn under it */
  hold: boolean;
  drag: Drag | null;
  justDragged: boolean;
  lastTouch: number;
  /** was the last change of dish the visitor's doing? */
  byUser: boolean;
  shown: number;
  /** where `target` stood when the current trackpad swipe began, and how far it has travelled */
  wheelFrom: number | null;
  wheelSum: number;
  wheelTimer: number;
  /** phones: the loop stops while a dish is open and nothing moves; wake() restarts it */
  asleep: boolean;
  wake: () => void;
  camTimer: number;
};

const ZERO: Cam = { x: 0, y: 0, s: 1 };

function createEngine(): Engine {
  return {
    target: 0,
    pos: 0,
    vel: 0,
    cam: { ...ZERO },
    from: { ...ZERO },
    to: { ...ZERO },
    camT: 1,
    camDur: 1,
    view: "overview",
    layout: computeLayout(1280, 800, true),
    intro: -1,
    spin: INTRO_SPIN,
    ready: false,
    copyShown: false,
    open: false,
    reduced: false,
    onScreen: true,
    hold: false,
    drag: null,
    justDragged: false,
    lastTouch: 0,
    byUser: false,
    shown: 0,
    wheelFrom: null,
    wheelSum: 0,
    wheelTimer: 0,
    asleep: false,
    wake: () => {},
    camTimer: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="14"
      height="10"
      viewBox="0 0 14 10"
      fill="none"
      aria-hidden
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        d="M1 5h11M8.5 1.5 12 5 8.5 8.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const css = (vars: Record<string, string | number>) => vars as CSSProperties;

/* ------------------------------------------------------------------ */
/* The hero                                                            */
/* ------------------------------------------------------------------ */

const LETTERS = [...brand.lettering.toUpperCase()];
/** radius of the lettering's baseline, in table units */
const RING_R = 238;

/**
 * The stitched lettering round the middle of the cloth, one letter per span.
 *
 * It used to be SVG text on a path, but Chrome re-lays out SVG text whenever
 * its on-screen scale changes, so every frame of a camera zoom (the opening,
 * opening a dish) paid for it. HTML letters are laid out once.
 *
 * Like SVG's textLength, the letters are spaced from their real widths so the
 * line closes exactly on itself; until the font is measured they are spaced
 * evenly, which is also what the server renders.
 */
function RingText() {
  const ref = useRef<HTMLDivElement>(null);
  const [angles, setAngles] = useState<number[] | null>(null);
  useEffect(() => {
    let live = true;
    const measure = () => {
      const el = ref.current;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!live || !el || !ctx) return;
      const style = getComputedStyle(el);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const widths = LETTERS.map((ch) => ctx.measureText(ch).width);
      const gap =
        (2 * Math.PI * RING_R - widths.reduce((a, b) => a + b, 0)) /
        LETTERS.length;
      let along = 0;
      setAngles(
        widths.map((w) => {
          const mid = along + w / 2;
          along += w + gap;
          return (mid / RING_R) * (180 / Math.PI) - 90; // starts at nine o'clock, runs clockwise
        }),
      );
    };
    const font = document.fonts?.load('560 27px "Fraunces"');
    (font ?? Promise.resolve()).then(measure, measure);
    return () => {
      live = false;
    };
  }, []);
  return (
    <div ref={ref} className="ring-text">
      {LETTERS.map((ch, i) => (
        <span
          key={i}
          style={{
            // turn about the centre, then stand on the ring (the baseline sits a fifth of an em above the foot)
            transform: `rotate(${(angles ? angles[i] : ((i + 0.5) / LETTERS.length) * 360 - 90).toFixed(3)}deg) translateY(calc(${-RING_R}px + 0.2em))`,
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

/** The cloth's lettering never changes, so React leaves it alone. */
const ClothScene = memo(function ClothScene() {
  return (
    <div className="cloth-lettering" aria-hidden>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle className="stitch" cx={HALF} cy={HALF} r={186} />
        <circle className="stitch" cx={HALF} cy={HALF} r={296} />
        <circle className="hem" cx={HALF} cy={HALF} r={972} />
      </svg>
      <RingText />
    </div>
  );
});

/**
 * The loose ingredients never move against the cloth, so they are drawn once.
 * Only their shadows move: the whole shadow layer is shifted each frame so the
 * light stays at the upper left of the screen while the table turns.
 */
const LooseScene = memo(function LooseScene({
  shadowsRef,
}: {
  shadowsRef: RefObject<HTMLDivElement | null>;
}) {
  const placed = loose.map((item, j) => {
    const g = ingredients[item.key];
    const a = (item.angle * Math.PI) / 180;
    const size = g.size * (item.scale ?? 1);
    const style: CSSProperties = {
      left: HALF + Math.sin(a) * item.radius - size / 2,
      top: HALF - Math.cos(a) * item.radius - size / 2,
      width: size,
      height: size,
      transform: `rotate(${item.rotate}deg)`,
    };
    return { id: `${item.key}-${j}`, g, style };
  });
  return (
    <div className="loose" aria-hidden>
      <div ref={shadowsRef} className="loose-shadows">
        {placed.map((p) => (
          <img
            key={p.id}
            data-wait
            src={asset(p.g.shadow)}
            alt=""
            draggable={false}
            style={p.style}
          />
        ))}
      </div>
      {placed.map((p) => (
        <img
          key={p.id}
          data-wait
          src={asset(p.g.file)}
          alt=""
          draggable={false}
          style={p.style}
        />
      ))}
    </div>
  );
});

export default function Hero() {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"loading" | "intro" | "ready">("loading");
  const [dragging, setDragging] = useState(false);
  const [portions, setPortions] = useState(1);
  const [added, setAdded] = useState(false);
  const [order, setOrder] = useState<Record<string, number>>({});
  const [orderOpen, setOrderOpen] = useState(false);
  // phones: the list of all eight dishes
  const [listOpen, setListOpen] = useState(false);
  const [say, setSay] = useState("");
  // On a phone only one dish name is ever in the page: the outgoing one is
  // dropped at once instead of sliding out past the incoming one.
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );

  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const plateRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const plateShadowsRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const looseShadowsRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  if (engineRef.current === null) engineRef.current = createEngine();

  const dish = dishes[active];
  const fullName = `${dish.name[0]} ${dish.name[1]}`;
  const count = Object.values(order).reduce((a, b) => a + b, 0);
  const total = dishes.reduce(
    (sum, d) => sum + (order[d.id] ?? 0) * d.price,
    0,
  );

  /* ---------------- camera ---------------- */

  // Phones: the camera jumps to its new place in one write and the browser
  // animates it (transform only, on the compositor). The browser then knows
  // the zoom's end in advance and paints the cloth once, at its final size,
  // instead of repainting it in pieces on every frame of a scripted zoom.
  const glideCamera = useCallback(() => {
    const e = engineRef.current!;
    const world = worldRef.current;
    if (!world) return;
    world.style.transition = e.reduced
      ? "none"
      : `transform ${CAM_MS}ms ${CAM_EASE}, opacity 0.9s ease`;
    window.clearTimeout(e.camTimer);
    e.camTimer = window.setTimeout(() => {
      world.style.transition = "";
    }, CAM_MS + 80);
  }, []);

  const moveCamera = useCallback(
    (view: ViewName, seconds: number) => {
      const e = engineRef.current!;
      e.view = view;
      e.to = e.layout[view];
      if (onPhone()) {
        glideCamera();
        e.cam = { ...e.to };
        e.camT = 1;
        e.wake();
        return;
      }
      if (e.reduced || seconds <= 0) {
        e.cam = { ...e.to };
        e.camT = 1;
        return;
      }
      e.from = { ...e.cam };
      e.camT = 0;
      e.camDur = seconds;
    },
    [glideCamera],
  );

  /* ---------------- turning ---------------- */

  const touch = useCallback(() => {
    const e = engineRef.current!;
    e.lastTouch = performance.now();
    e.byUser = true;
  }, []);

  const step = useCallback(
    (delta: number) => {
      const e = engineRef.current!;
      if (!e.ready || e.open) return;
      e.target = Math.round(e.target) + delta;
      touch();
    },
    [touch],
  );

  const goTo = useCallback(
    (index: number) => {
      const e = engineRef.current!;
      if (!e.ready || e.open) return;
      const here = Math.round(e.target);
      e.target = here + wrap(index - here);
      touch();
    },
    [touch],
  );

  const openDish = useCallback(
    (opener?: HTMLElement | null) => {
      const e = engineRef.current!;
      if (!e.ready) return;
      e.target = Math.round(e.target);
      if (onPhone()) {
        // stop the table at once: no spin or flick carries on under the dish
        e.pos = e.target;
        e.vel = 0;
        e.drag = null;
        // aim the camera now, so the layout change that follows animates once
        e.view = "detail";
        glideCamera();
        e.wake();
      }
      openerRef.current =
        opener ?? (document.activeElement as HTMLElement | null);
      setPortions(1);
      setAdded(false);
      setOrderOpen(false);
      setListOpen(false);
      setOpen(true);
    },
    [glideCamera],
  );

  const pickDish = (index: number) => {
    goTo(index);
    setListOpen(false);
  };

  const closeDish = useCallback(() => {
    const e = engineRef.current!;
    if (onPhone()) {
      e.view = "browse";
      glideCamera();
      e.wake();
    }
    setOpen(false);
  }, [glideCamera]);

  /* ---------------- the one animation loop ---------------- */

  useEffect(() => {
    const e = engineRef.current!;
    const hero = heroRef.current!;
    const stage = stageRef.current!;
    const wideQuery = window.matchMedia(WIDE_QUERY);
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    e.reduced = motionQuery.matches;

    const measure = () => {
      // the stage fills the hero from 768 px up; on a phone it is the space
      // the copy (or an open dish's details) leaves under the nav
      const box = stage.getBoundingClientRect();
      let slot: Slot | undefined;
      if (mobileQuery.matches) {
        const nav = navRef.current;
        const top = nav ? nav.offsetTop + nav.offsetHeight : 76;
        const room = box.height - top;
        // 88% of the width, at most 420 px, and never taller than the room
        const d = Math.max(96, Math.min(box.width * 0.88, 420, room - 18));
        slot = { x: box.width / 2, y: top + room / 2, d };
      }
      e.layout = computeLayout(box.width, box.height, wideQuery.matches, slot);
      e.to = e.layout[e.view];
      if (e.intro >= 0) e.from = e.layout.overview;
      else if (e.camT >= 1) e.cam = { ...e.to };
      e.wake();
    };
    measure();
    e.cam = { ...e.layout.overview };

    const onMotion = () => {
      e.reduced = motionQuery.matches;
    };
    const resize = new ResizeObserver(measure);
    resize.observe(hero);
    resize.observe(stage);
    wideQuery.addEventListener("change", measure);
    mobileQuery.addEventListener("change", measure);
    motionQuery.addEventListener("change", onMotion);

    const seen = new IntersectionObserver(
      ([entry]) => (e.onScreen = entry.isIntersecting),
      { threshold: 0.1 },
    );
    seen.observe(hero);

    // last value written to each element, so an idle table writes nothing
    const wrote: Record<string, string> = {};
    const put = (key: string, el: HTMLElement | null, value: string) => {
      if (!el || wrote[key] === value) return;
      wrote[key] = value;
      el.style.transform = value;
    };

    let raf = 0;
    let last = performance.now();

    e.wake = () => {
      if (!e.asleep) return;
      e.asleep = false;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      if (!e.onScreen || document.hidden) {
        e.lastTouch = now;
        return;
      }

      // --- the opening: glide from the overview while the table spins to rest
      if (e.intro >= 0) {
        e.intro = Math.min(1, e.intro + dt / (INTRO_HOLD + INTRO_GLIDE));
        const glide = clamp(
          (e.intro * (INTRO_HOLD + INTRO_GLIDE) - INTRO_HOLD) / INTRO_GLIDE,
          0,
          1,
        );
        const k = easeInOut(glide);
        const a = e.from;
        const b = e.to;
        e.cam.x = a.x + (b.x - a.x) * k;
        e.cam.y = a.y + (b.y - a.y) * k;
        e.cam.s = a.s * Math.pow(b.s / a.s, k);
        e.spin = INTRO_SPIN * (1 - easeOut(e.intro));
        if (glide > 0.6 && !e.copyShown) {
          e.copyShown = true;
          setPhase("ready");
        }
        if (e.intro >= 1) {
          e.intro = -1;
          e.spin = 0;
          e.ready = true;
          e.lastTouch = now;
        }
      } else if (e.camT < 1) {
        // --- moving between views: position is linear, scale is geometric,
        // otherwise the zoom rushes at the start and crawls at the end
        e.camT = Math.min(1, e.camT + dt / e.camDur);
        const k = easeInOut(e.camT);
        const a = e.from;
        const b = e.to;
        e.cam.x = a.x + (b.x - a.x) * k;
        e.cam.y = a.y + (b.y - a.y) * k;
        e.cam.s = a.s * Math.pow(b.s / a.s, k);
      }

      // --- left alone, step on
      if (
        e.ready &&
        !e.open &&
        !e.drag &&
        !e.hold &&
        !e.reduced &&
        now - e.lastTouch > AUTO_MS
      ) {
        e.target = Math.round(e.target) + 1;
        e.lastTouch = now;
        e.byUser = false;
      }

      // --- pos eases toward target
      if (e.reduced) {
        e.pos = e.target;
        e.vel = 0;
      } else if (e.drag?.active) {
        // under the finger the table keeps a little weight
        const next = e.pos + (e.target - e.pos) * (1 - Math.exp(-dt * 26));
        e.vel = (next - e.pos) / dt;
        e.pos = next;
      } else {
        const x0 = e.pos - e.target;
        if (Math.abs(x0) < 0.001 && Math.abs(e.vel) < 0.01) {
          e.pos = e.target;
          e.vel = 0;
        } else {
          const decay = Math.exp(-OMEGA * dt);
          const b = e.vel + OMEGA * x0;
          e.pos = e.target + (x0 + b * dt) * decay;
          e.vel = (e.vel - OMEGA * b * dt) * decay;
        }
      }

      // --- which dish is in front
      const front = mod(Math.round(e.target), N);
      if (front !== e.shown) {
        const way = wrap(front - e.shown) >= 0 ? 1 : -1;
        const old = e.shown;
        e.shown = front;
        setDir(way);
        setPrev(old);
        setActive(front);
        if (e.byUser) {
          const d = dishes[front];
          setSay(
            `${d.name[0]} ${d.name[1]}, ${d.price} euros. Dish ${front + 1} of ${N}.`,
          );
        }
      }

      // --- write the transforms
      const { front: frontAngle } = e.layout;
      const rot = frontAngle - e.pos * STEP + e.spin;
      put(
        "world",
        worldRef.current,
        `translate3d(${e.cam.x.toFixed(2)}px, ${e.cam.y.toFixed(2)}px, 0) scale(${e.cam.s.toFixed(5)})`,
      );
      // Laptop and tablet: the whole table turns, cloth and all. Phone: the
      // cloth stays still and only the ring of plates travels round it, so
      // the phone never has to redraw a huge turning textured cloth.
      const still = !e.layout.wide;
      const clothRot = still ? 0 : rot;
      put("table", tableRef.current, `rotate(${clothRot.toFixed(3)}deg)`);
      put(
        "ring",
        ringRef.current,
        `rotate(${(still ? rot : 0).toFixed(3)}deg)`,
      );
      put(
        "light",
        lightRef.current,
        `rotate(${(-clothRot).toFixed(3)}deg) scale(${SIZE / 250})`,
      );

      // The light sits at the upper left of the screen. A screen offset turned
      // back into table space shifts each shadow layer as a whole, so a turn
      // costs two writes here instead of one per shadow.
      const r = (rot * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const psx = PLATE_SHADOW.x * cos + PLATE_SHADOW.y * sin;
      const psy = -PLATE_SHADOW.x * sin + PLATE_SHADOW.y * cos;
      const rc = (clothRot * Math.PI) / 180;
      const ccos = Math.cos(rc);
      const csin = Math.sin(rc);
      put(
        "plate-shadows",
        plateShadowsRef.current,
        `translate(${psx.toFixed(2)}px, ${psy.toFixed(2)}px)`,
      );
      const lsx = LOOSE_SHADOW.x * ccos + LOOSE_SHADOW.y * csin;
      const lsy = -LOOSE_SHADOW.x * csin + LOOSE_SHADOW.y * ccos;
      put(
        "loose-shadows",
        looseShadowsRef.current,
        `translate(${lsx.toFixed(2)}px, ${lsy.toFixed(2)}px)`,
      );

      // Only the plates near the front change size, so only they are written.
      for (let i = 0; i < N; i++) {
        const away = Math.abs(wrap(i - e.pos));
        const grow = 1 + BOOST * smooth(clamp(1 - away, 0, 1));
        const lift = grow - 1;
        const at = i * STEP;
        // each plate carries a fixed turn of its own, so it is upright at the front
        put(
          `p${i}`,
          plateRefs.current[i],
          `rotate(${at}deg) translateY(${-RING}px) rotate(${-frontAngle}deg) scale(${grow.toFixed(4)})`,
        );
        // a raised plate grows its shadow and throws it a little further
        put(
          `s${i}`,
          shadowRefs.current[i],
          `translate(${(psx * lift).toFixed(2)}px, ${(psy * lift).toFixed(2)}px) rotate(${at}deg) translateY(${-RING}px) scale(${(grow * PLATE_SHADOW.scale).toFixed(4)})`,
        );
      }

      // the fly-out ingredients sit under the front plate, square to the screen
      const at = front * STEP;
      put(
        "burst",
        burstRef.current,
        `rotate(${at}deg) translateY(${-RING}px) rotate(${(-(rot + at)).toFixed(3)}deg)`,
      );

      // Phones: with a dish open nothing is left for the loop to do (the
      // camera glides on its own), so it stops until something wakes it.
      if (
        e.open &&
        mobileQuery.matches &&
        e.intro < 0 &&
        e.camT >= 1 &&
        !e.drag &&
        e.pos === e.target
      ) {
        cancelAnimationFrame(raf);
        e.asleep = true;
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      e.asleep = false;
      e.wake = () => {};
      window.clearTimeout(e.camTimer);
      resize.disconnect();
      seen.disconnect();
      wideQuery.removeEventListener("change", measure);
      mobileQuery.removeEventListener("change", measure);
      motionQuery.removeEventListener("change", onMotion);
    };
  }, []);

  /* ---------------- start once the plates have arrived ---------------- */

  useEffect(() => {
    const e = engineRef.current!;
    let cancelled = false;
    const start = () => {
      if (cancelled || e.intro >= 0 || e.ready) return;
      e.view = "browse";
      e.to = e.layout.browse;
      if (e.reduced) {
        e.cam = { ...e.to };
        e.spin = 0;
        e.ready = true;
        e.copyShown = true;
        e.lastTouch = performance.now();
        setPhase("ready");
        return;
      }
      e.from = e.layout.overview;
      e.cam = { ...e.from };
      e.intro = 0;
      setPhase("intro");
    };
    // decode(), not just load: everything on the table must be ready to paint
    // before the camera moves, or pieces pop in one by one during the opening.
    // The fonts too, so no text swaps its face in front of you.
    const pictures = Array.from(
      heroRef.current!.querySelectorAll<HTMLImageElement>("img[data-wait]"),
    );
    const weave = new Image();
    weave.src = asset("/img/linen-weave.webp");
    pictures.push(weave);
    const fonts = Promise.all(
      [
        '360 1em "Fraunces"',
        'italic 340 1em "Fraunces"',
        '500 1em "DM Sans"',
      ].map((face) =>
        document.fonts ? document.fonts.load(face).catch(() => []) : [],
      ),
    );
    Promise.all([
      Promise.all(pictures.map((img) => img.decode().catch(() => undefined))),
      fonts,
    ]).then(start);
    const giveUp = window.setTimeout(start, 5000);
    // A dish's fly-out ingredients include some that are not on the cloth:
    // fetch and decode them all now, so opening a dish never waits on one.
    for (const g of Object.values(ingredients)) {
      for (const src of [g.file, g.shadow]) {
        const img = new Image();
        img.src = asset(src);
        img.decode().catch(() => undefined);
      }
    }
    return () => {
      cancelled = true;
      window.clearTimeout(giveUp);
    };
  }, []);

  /* ---------------- opening and closing a dish ---------------- */

  useEffect(() => {
    const e = engineRef.current!;
    if (e.open === open) return;
    e.open = open;
    e.lastTouch = performance.now();
    if (!e.ready) return;
    moveCamera(open ? "detail" : "browse", open ? 1.05 : 0.9);
    if (open && window.matchMedia(MOBILE_QUERY).matches) {
      const hero = heroRef.current;
      if (hero && hero.getBoundingClientRect().top < -8) {
        hero.scrollIntoView({
          block: "start",
          behavior: e.reduced ? "auto" : "smooth",
        });
      }
    }
    if (open) {
      // the detail region takes focus once it is on its way in
      const id = window.setTimeout(
        () => detailRef.current?.focus({ preventScroll: true }),
        60,
      );
      return () => window.clearTimeout(id);
    }
    const back = openerRef.current;
    openerRef.current = null;
    if (
      back &&
      back.isConnected &&
      detailRef.current?.contains(document.activeElement)
    ) {
      back.focus({ preventScroll: true });
    }
  }, [open, moveCamera]);

  const listWasOpen = useRef(false);
  useEffect(() => {
    if (listOpen) {
      listWasOpen.current = true;
      const id = window.setTimeout(
        () =>
          listRef.current
            ?.querySelector<HTMLElement>('.dish-row[aria-current="true"]')
            ?.focus({ preventScroll: true }),
        40,
      );
      return () => window.clearTimeout(id);
    }
    if (listWasOpen.current) {
      listWasOpen.current = false;
      listButtonRef.current?.focus({ preventScroll: true });
    }
  }, [listOpen]);

  useEffect(() => {
    if (!added) return;
    const id = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(id);
  }, [added]);

  // the outgoing name only needs to live as long as its exit
  useEffect(() => {
    if (prev === null) return;
    const id = window.setTimeout(() => setPrev(null), 620);
    return () => window.clearTimeout(id);
  }, [prev, active]);

  /* ---------------- keys, wheel ---------------- */

  useEffect(() => {
    const e = engineRef.current!;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      const el = ev.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      if (ev.key === "Escape") {
        if (heroRef.current?.dataset.list === "true") setListOpen(false);
        else if (orderRef.current?.querySelector(".order-panel"))
          setOrderOpen(false);
        else if (e.open) closeDish();
        return;
      }
      if (e.open || !e.onScreen) return;
      if (ev.key === "ArrowRight") {
        step(1);
        ev.preventDefault();
      } else if (ev.key === "ArrowLeft") {
        step(-1);
        ev.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);

    // a sideways trackpad swipe turns the table; vertical scrolling is left alone
    const stage = stageRef.current!;
    const onWheel = (ev: WheelEvent) => {
      if (!e.ready || e.open) return;
      const ax = Math.abs(ev.deltaX);
      if (ax < 1 || ax < Math.abs(ev.deltaY) * 1.2) return;
      ev.preventDefault();
      // One swipe is one gesture: add up its travel (inertia included) and cap
      // it, so a hard flick turns the table a few plates, not all the way round.
      if (e.wheelFrom === null) {
        e.wheelFrom = e.target;
        e.wheelSum = 0;
      }
      e.wheelSum += ev.deltaMode === 1 ? ev.deltaX * 16 : ev.deltaX;
      e.target = e.wheelFrom + clamp(e.wheelSum / 380, -2.6, 2.6);
      e.lastTouch = performance.now();
      e.byUser = true;
      window.clearTimeout(e.wheelTimer);
      e.wheelTimer = window.setTimeout(() => {
        e.target = Math.round(e.target);
        e.wheelFrom = null;
      }, 130);
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      stage.removeEventListener("wheel", onWheel);
      window.clearTimeout(e.wheelTimer);
    };
  }, [closeDish, step]);

  // the order panel closes on a click anywhere else
  useEffect(() => {
    if (!orderOpen) return;
    const onDown = (ev: PointerEvent) => {
      if (!orderRef.current?.contains(ev.target as Node)) setOrderOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [orderOpen]);

  /* ---------------- dragging the table ---------------- */

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const e = engineRef.current!;
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    e.justDragged = false;
    if (!e.ready || e.open || e.drag) return;
    e.drag = {
      id: ev.pointerId,
      touch: ev.pointerType === "touch",
      sx: ev.clientX,
      sy: ev.clientY,
      x: ev.clientX,
      y: ev.clientY,
      active: false,
    };
  };

  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const e = engineRef.current!;
    const d = e.drag;
    if (!d || d.id !== ev.pointerId) return;
    if (!d.active) {
      const tx = ev.clientX - d.sx;
      const ty = ev.clientY - d.sy;
      if (Math.hypot(tx, ty) < (d.touch ? 9 : 5)) return;
      // On touch the first few pixels decide: sideways turns the table,
      // up-and-down belongs to the page (touch-action: pan-y does the rest).
      if (d.touch && Math.abs(ty) > Math.abs(tx)) {
        e.drag = null;
        return;
      }
      d.active = true;
      d.x = ev.clientX;
      d.y = ev.clientY;
      try {
        stageRef.current?.setPointerCapture(d.id);
      } catch {
        /* the pointer is already gone */
      }
      setDragging(true);
      e.lastTouch = performance.now();
      e.byUser = true;
      return;
    }
    // How far did the pointer travel along the rim? Divide by the radius it is
    // pushing at and you have the angle, so the table moves with the hand.
    const box = stageRef.current!.getBoundingClientRect();
    const rx = d.x - (box.left + e.cam.x);
    const ry = d.y - (box.top + e.cam.y);
    const r = Math.hypot(rx, ry) || 1;
    const along = ((ev.clientX - d.x) * -ry + (ev.clientY - d.y) * rx) / r;
    // On a phone the whole table is small, so the rim is short: push against a
    // longer lever there, or one ordinary swipe would spin past three dishes.
    const lever = Math.max(
      r,
      RING * e.cam.s * 0.5,
      isMobile ? SIZE * e.cam.s * 0.75 : 0,
    );
    e.target -= ((along / lever) * 180) / Math.PI / STEP;
    d.x = ev.clientX;
    d.y = ev.clientY;
    e.lastTouch = performance.now();
  };

  const endDrag = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const e = engineRef.current!;
    const d = e.drag;
    if (!d || d.id !== ev.pointerId) return;
    e.drag = null;
    if (!d.active) return;
    // a flick carries on, then settles on a dish
    const throwTo = e.target + clamp(e.vel * 0.26, -2.2, 2.2);
    e.target = Math.round(throwTo);
    e.lastTouch = performance.now();
    // the browser still fires a click on whatever is under the pointer
    e.justDragged = true;
    window.setTimeout(() => (e.justDragged = false), 320);
    setDragging(false);
  };

  const onPlateClick = (
    index: number,
    ev: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    const e = engineRef.current!;
    ev.stopPropagation();
    if (e.justDragged || !e.ready) return;
    if (e.open) closeDish();
    else if (index === mod(Math.round(e.target), N)) openDish(ev.currentTarget);
    else goTo(index);
  };

  const onStageClick = () => {
    const e = engineRef.current!;
    if (e.justDragged) return;
    if (e.open) closeDish(); // the empty table closes an open dish
  };

  const hold = (on: boolean) => {
    const e = engineRef.current!;
    e.hold = on;
    e.lastTouch = performance.now();
  };

  /* ---------------- the order ---------------- */

  const addToOrder = () => {
    setOrder((o) => ({ ...o, [dish.id]: (o[dish.id] ?? 0) + portions }));
    setAdded(true);
    setSay(`Added ${portions} × ${fullName} to your order.`);
  };

  const theme = css({
    "--floor": dish.floor,
    "--accent": dish.accent,
    "--tint": dish.tint,
    "--dir": dir,
  });

  return (
    <section
      id="menu"
      ref={heroRef}
      className="hero"
      style={theme}
      data-phase={phase}
      data-open={open}
      data-drag={dragging}
      data-list={listOpen}
      aria-roledescription="carousel"
      aria-label="The menu: a round table. Turn it to choose a dish."
    >
      <div className="floor" aria-hidden />
      <h1 className="sr-only">
        {brand.name}. {brand.tagline}
      </h1>
      <p className="sr-only" aria-live="polite">
        {say}
      </p>

      {/* ---------- nav ---------- */}
      <header ref={navRef} className="hero-nav">
        <a
          href="#menu"
          className="block flex-1 leading-none"
          aria-label={`${brand.name}, ${brand.tagline}`}
        >
          <span className="block font-serif text-[1.12rem] font-medium tracking-[0.34em]">
            {brand.name}
          </span>
          <span className="mt-[0.45rem] block text-[0.54rem] font-medium tracking-[0.3em] text-cream/55 uppercase">
            {brand.tagline}
          </span>
        </a>

        <nav aria-label="Primary" className="hidden flex-none pt-1 wide:block">
          <ul className="flex gap-9">
            {nav.map((item) => (
              <li key={item.href}>
                <a className="nav-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div ref={orderRef} className="relative flex flex-1 justify-end pt-1">
          <button
            type="button"
            className="nav-link flex items-center gap-2.5"
            aria-expanded={orderOpen}
            aria-controls="order-panel"
            onClick={() => setOrderOpen((v) => !v)}
          >
            <span>Order</span>
            <span key={count} className="badge" aria-hidden>
              {count}
            </span>
            <span className="sr-only">
              , {count} {count === 1 ? "portion" : "portions"}
            </span>
          </button>
          {orderOpen && (
            <div
              id="order-panel"
              className="order-panel"
              role="dialog"
              aria-label="Your order"
            >
              <p className="label">Your order</p>
              {count === 0 ? (
                <p className="mt-3 text-[0.9rem] leading-relaxed text-cream/70">
                  Nothing yet. Turn the table, open a dish and add it from
                  there.
                </p>
              ) : (
                <>
                  <ul className="mt-3 divide-y divide-cream/15 border-y border-cream/15 text-[0.9rem]">
                    {dishes
                      .filter((d) => order[d.id])
                      .map((d) => (
                        <li
                          key={d.id}
                          className="flex items-baseline justify-between gap-4 py-2.5"
                        >
                          <span>
                            <span className="text-cream/55 tabular-nums">
                              {order[d.id]} ×
                            </span>{" "}
                            {d.name[0]} {d.name[1]}
                          </span>
                          <span className="tabular-nums">
                            €{order[d.id] * d.price}
                          </span>
                        </li>
                      ))}
                  </ul>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="label">Total</span>
                    <span className="font-serif text-[1.5rem] leading-none">
                      €{total}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-4 text-[0.62rem] font-semibold tracking-[0.22em] text-cream/60 uppercase underline-offset-4 hover:text-cream hover:underline"
                    onClick={() => setOrder({})}
                  >
                    Clear the order
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ---------- the table ---------- */}
      <div
        ref={stageRef}
        className="stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={onStageClick}
      >
        {/* on a phone, the square the whole table is fitted into */}
        <div ref={worldRef} className="world">
          <div className="table-shadow" />
          <div ref={tableRef} className="table">
            <div className="cloth">
              <div className="cloth-tint" />
              <div
                className="cloth-weave"
                style={{
                  backgroundImage: `url(${asset("/img/linen-weave.webp")})`,
                }}
              />
              <ClothScene />
              <LooseScene shadowsRef={looseShadowsRef} />
              <div ref={lightRef} className="cloth-light" />
            </div>

            {/* the plates, their shadows and the fly-out ingredients: on a
                phone this ring turns on its own over a still cloth */}
            <div ref={ringRef} className="plate-ring">
              {/* every shadow under every plate */}
              <div ref={plateShadowsRef} className="plate-shadows" aria-hidden>
                {dishes.map((d, i) => (
                  <div
                    key={d.id}
                    className="plate-shadow"
                    data-front={i === active}
                    ref={(el) => {
                      shadowRefs.current[i] = el;
                    }}
                  />
                ))}
              </div>

              <div ref={burstRef} className="burst" aria-hidden>
                {dish.ingredients.map((key, i) => {
                  const g = ingredients[key];
                  const spot = burstSpots[i];
                  return (
                    <div
                      key={`${dish.id}-${key}`}
                      className="burst-item"
                      style={css({
                        "--bx": `${spot.x}px`,
                        "--by": `${spot.y}px`,
                        "--r": `${spot.rotate}deg`,
                        "--i": i,
                        "--size": `${Math.round(g.size * 1.1)}px`,
                      })}
                    >
                      <img
                        className="burst-shadow"
                        src={asset(g.shadow)}
                        alt=""
                        draggable={false}
                      />
                      <img
                        className="burst-img"
                        src={asset(g.file)}
                        alt=""
                        draggable={false}
                      />
                    </div>
                  );
                })}
              </div>

              {dishes.map((d, i) => {
                const name = `${d.name[0]} ${d.name[1]}`;
                const isFront = i === active;
                const label = open
                  ? isFront
                    ? `${name}. Back to the table`
                    : `Back to the table`
                  : isFront
                    ? `${name}, ${d.price} euros. View the dish`
                    : `${name}. Bring to the front`;
                return (
                  <div
                    key={d.id}
                    className="plate"
                    data-front={isFront}
                    ref={(el) => {
                      plateRefs.current[i] = el;
                    }}
                  >
                    <button
                      type="button"
                      className="plate-btn"
                      tabIndex={isFront ? 0 : -1}
                      aria-label={label}
                      onClick={(ev) => onPlateClick(i, ev)}
                    >
                      {/* phones get a lighter 800 px plate; laptops and tablets the full 1200 px */}
                      <picture>
                        <source media={WIDE_QUERY} srcSet={asset(d.image)} />
                        <img
                          data-wait
                          src={asset(
                            d.image.replace("/dishes/", "/dishes/sm/"),
                          )}
                          alt=""
                          width={PLATE}
                          height={PLATE}
                          draggable={false}
                        />
                      </picture>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="vignette" />
        </div>
      </div>

      <div className="scrim" />

      {/* ---------- copy ---------- */}
      <div
        className="copy"
        onPointerEnter={(ev) => ev.pointerType === "mouse" && hold(true)}
        onPointerLeave={() => hold(false)}
        onFocus={(ev) => ev.target.matches(":focus-visible") && hold(true)}
        onBlur={() => hold(false)}
      >
        {phase === "ready" && (
          <>
            <p key={`meta-${active}`} className="meta fade-up">
              <span>
                {pad(active + 1)} <span className="opacity-45">/ {pad(N)}</span>
              </span>
              <span className="rule" />
              <span>{dish.course}</span>
            </p>

            <h2 className="title" aria-label={fullName}>
              {!isMobile && prev !== null && prev !== active && (
                <span
                  key={`out-${prev}`}
                  className="title-layer is-out"
                  style={css({ "--line-accent": dishes[prev].accent })}
                  aria-hidden
                >
                  <span className="mask">
                    <span className="line">{dishes[prev].name[0]}</span>
                  </span>
                  <span className="mask">
                    <span className="line accent">{dishes[prev].name[1]}</span>
                  </span>
                </span>
              )}
              <span
                key={`in-${active}`}
                className="title-layer is-in"
                style={css({ "--line-accent": dish.accent })}
                aria-hidden
              >
                <span className="mask">
                  <span className="line">{dish.name[0]}</span>
                </span>
                <span className="mask">
                  <span className="line accent">{dish.name[1]}</span>
                </span>
              </span>
            </h2>

            <div className="browse" inert={open}>
              <p
                key={`line-${active}`}
                className="lede fade-up mt-4 wide:mt-5"
                style={css({ "--d": "0.12s" })}
              >
                {dish.line}
              </p>
              <div
                className="fade-up mt-5 flex items-center gap-4 wide:mt-6"
                style={css({ "--d": "0.2s" })}
              >
                <span key={`price-${active}`} className="price fade-up">
                  €{dish.price}
                </span>
                <button
                  type="button"
                  className="pill"
                  onClick={(ev) => openDish(ev.currentTarget)}
                >
                  View the dish <Arrow />
                </button>
              </div>
              <div
                className="fade-up mt-5 flex items-center gap-2 wide:mt-7"
                style={css({ "--d": "0.28s" })}
              >
                <button
                  type="button"
                  className="round"
                  aria-label="Previous dish"
                  onClick={() => step(-1)}
                >
                  <Arrow flip />
                </button>
                <div
                  className="ticks flex items-center px-1 max-[768px]:hidden"
                  role="group"
                  aria-label="Choose a dish"
                >
                  {dishes.map((d, i) => (
                    <button
                      key={d.id}
                      type="button"
                      className="tick"
                      // the arrows either side (and the arrow keys) already do this from a keyboard
                      tabIndex={-1}
                      aria-label={`${d.name[0]} ${d.name[1]}`}
                      aria-current={i === active ? "true" : undefined}
                      onClick={() => goTo(i)}
                    />
                  ))}
                </div>
                {/* phones: the dots give way to the full list */}
                <button
                  ref={listButtonRef}
                  type="button"
                  className="all-dishes"
                  aria-haspopup="dialog"
                  aria-expanded={listOpen}
                  aria-controls="dish-list"
                  onClick={() => setListOpen(true)}
                >
                  All dishes ({pad(N)})
                </button>
                <button
                  type="button"
                  className="round"
                  aria-label="Next dish"
                  onClick={() => step(1)}
                >
                  <Arrow />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ---------- details ---------- */}
      <div
        ref={detailRef}
        className="detail"
        role="region"
        aria-label={`${fullName}: on the plate, allergens, wine and ordering`}
        tabIndex={-1}
        inert={!open}
      >
        <div className="detail-grip wide:hidden" aria-hidden />
        {/* phones: this part scrolls and the order bar stays under it; from
            768 px up it is display: contents and changes nothing */}
        <div className="detail-body">
          <button
            type="button"
            className="back stagger"
            style={css({ "--n": 0 })}
            onClick={closeDish}
          >
            <Arrow flip /> Back to the table
          </button>

          <p
            className="sheet-title stagger mt-4 wide:hidden"
            style={css({ "--n": 1 })}
          >
            {dish.name[0]} <em>{dish.name[1]}</em>
          </p>

          <p className="lede stagger mt-3 wide:mt-4" style={css({ "--n": 1 })}>
            {dish.line}
          </p>

          <div className="stagger mt-5" style={css({ "--n": 2 })}>
            <h3 className="label">On the plate</h3>
            <ul className="plate-list mt-2.5">
              {dish.onPlate.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <dl
            className="stagger mt-5 grid grid-cols-2 gap-x-6"
            style={css({ "--n": 3 })}
          >
            <div>
              <dt className="label">Allergens</dt>
              <dd className="mt-1.5 text-[0.9rem] leading-snug">
                {dish.allergens}
              </dd>
            </div>
            <div>
              <dt className="label">We pair</dt>
              <dd className="mt-1.5 text-[0.9rem] leading-snug">{dish.wine}</dd>
            </div>
          </dl>
        </div>

        <div className="detail-bar stagger wide:mt-6" style={css({ "--n": 4 })}>
          <div className="stepper" role="group" aria-label="Portions">
            <button
              type="button"
              aria-label="One portion fewer"
              disabled={portions <= 1}
              onClick={() => setPortions((p) => Math.max(1, p - 1))}
            >
              −
            </button>
            <output
              aria-live="polite"
              aria-label={`${portions} ${portions === 1 ? "portion" : "portions"}`}
            >
              {portions}
            </output>
            <button
              type="button"
              aria-label="One portion more"
              disabled={portions >= 9}
              onClick={() => setPortions((p) => Math.min(9, p + 1))}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="pill min-w-0 flex-1 wide:flex-none max-[768px]:min-w-max"
            data-done={added}
            onClick={addToOrder}
          >
            {added ? (
              <>Added to your order ✓</>
            ) : (
              <>
                Add to order · €{dish.price} × {portions}
              </>
            )}
          </button>
        </div>
      </div>
      {/* ---------- phones: every dish in one list ---------- */}
      <div
        className="dish-list-backdrop"
        aria-hidden
        onClick={() => setListOpen(false)}
      />
      <div
        ref={listRef}
        id="dish-list"
        className="dish-list"
        role="dialog"
        aria-label="All dishes"
        inert={!listOpen}
      >
        <div className="dish-list-head">
          <p className="label">The menu · {pad(N)} dishes</p>
          <button
            type="button"
            className="back"
            onClick={() => setListOpen(false)}
          >
            Close
          </button>
        </div>
        <ol>
          {dishes.map((d, i) => (
            <li key={d.id}>
              <button
                type="button"
                className="dish-row"
                aria-current={i === active ? "true" : undefined}
                onClick={() => pickDish(i)}
              >
                <span className="dish-row-num">{pad(i + 1)}</span>
                <span className="dish-row-name">
                  {d.name[0]} <em style={{ color: d.accent }}>{d.name[1]}</em>
                </span>
                <span className="dish-row-meta">
                  {d.course} · €{d.price}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

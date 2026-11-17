# TAVOLA

A one-screen hero for a fictional restaurant: the menu is a round table seen
from directly above, and you turn the table to choose a dish.

Next.js (App Router) · TypeScript · Tailwind v4 · no animation or carousel
library. It is React, CSS and one `requestAnimationFrame` loop.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
TAVOLA_EXPORT=1 npm run build   # plain static site in ./out, no server needed
```

Needs Node.js 20.9 or newer.

## Using it

- **Turn the table:** drag anywhere on it, flick it, swipe sideways on a
  trackpad, press ← / →, use the two arrow buttons or the row of ticks, or
  click a neighbouring plate. Left alone it steps on every five seconds.
- **Open a dish:** click the front plate or "View the dish". The camera moves
  in, the other plates fade, four ingredients fly out, and the left column
  shows what is on the plate, allergens, a wine and the order controls.
- **Close it:** the back link, Escape, the plate, or the empty table.
- **On a phone** (under 768 px) everything fits one screen (`100dvh`): the
  whole table (up to `min(88vw, 420px)`, smaller if the screen is short) with
  all eight plates in view, and under it the dish, its price, "View the dish",
  the arrows and an **All dishes (08)** button that lists every dish. The cloth
  stays still while the ring of plates turns, and names swap with a quick
  fade. Opening a dish glides the camera in 300 ms (compositor only), pauses
  the animation loop, and shows the details at once in their own scrolling
  area above the order bar. From 768 px up (tablets, laptops) the layout is
  the one described above.

## Changing the content

Everything the page says or shows is in [`src/config.ts`](src/config.ts): the
brand, the nav, the ingredient cut-outs (file, name, size), the loose
ingredients on the cloth, and the dishes. Each dish has an image, a course, a
two-line name, a sentence, a price, a cloth tint, a floor colour, an accent,
four ingredient keys, what is on the plate, allergens and a wine.

To use your own photographs, shoot (or generate) each plate from exactly
above, cut it out of its background, crop it square so the rim touches all
four edges, drop it in `public/img/dishes/` and point `image` at it. Because
the plates are seen from straight above, they look right at any angle.

## How it is built

Two nested boxes do the work (`src/components/Hero.tsx`):

- the **world**, a zero-size box that is translated and scaled as one. This is
  the camera. Three views are computed from the screen size (overview, browse,
  detail) and the camera eases between them; scale is interpolated
  geometrically so the zoom does not rush at the start.
- the **table**, a 2000 × 2000 disc inside it that is rotated as one. The
  plates are its children on a ring 700 from the middle.

`target` is the dish that should be at the front (fractional while dragging);
`pos` follows it on a critically damped spring and the rotation comes from
`pos`. The plate shadows sit on the ring with their plates, and the whole set
is shifted each frame by the screen's light offset turned into table space, so
the light always comes from the upper left of the screen.

The cloth is the dish's tint as a plain colour layer with the linen weave on
top, stored as black with alpha = 1 − linen. That gives exactly tint × linen
(what a multiply blend would) without a blend mode.

### Keeping it smooth on phones

The rotation is driven from JavaScript, so anything that keeps the main thread
busy shows up as a stutter. A few rules keep it light:

- Per-dish colours fade on a handful of plain-colour layers (`.floor`,
  `.scrim`, `.cloth-tint`), never as variables the whole page inherits:
  animating those restyled every element on every frame.
- An idle table writes nothing; a turning one writes about eight transforms a
  frame (shadow sets, not individual shadows; only plates near the front).
- The lettering round the cloth is HTML, one letter per span. SVG text is
  re-laid out whenever its on-screen scale changes, so every camera zoom paid
  for it.
- The opening waits until the plates, the cloth, the loose ingredients and the
  fonts are decoded, so nothing pops in, and every ingredient image is warmed
  so opening a dish never waits on one.

`prefers-reduced-motion` skips the opening, the auto-turn and the easing.

## The artwork

There are no photographs in this project. Every plate, ingredient and the
linen were drawn in code (`art/`): each dish is a height field plus material
maps written with NumPy, then lit and path-traced from straight above with
Blender's Cycles.

```bash
python -m venv .venv && .venv/bin/pip install numpy scipy pillow bpy
.venv/bin/python art/build.py dish:risotto --res 600 --spp 40 --out /tmp/preview --png   # quick look
.venv/bin/python art/build.py all                                                         # everything → public/img
```

`art/dishes.py` holds the eight plates, `art/ingredients.py` the cut-outs,
`art/linen.py` the cloth, `art/kit.py` the drawing kit and `art/cyc.py` the
renderer. A full rebuild takes about 20 minutes on four CPU cores.

Tavola is not a real restaurant; the address and e-mail on the page are
placeholders.

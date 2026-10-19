# Downtown Mobile — Luxury Phone Repair Website

Premium single-page site for **Downtown Mobile**, 520 E Main St, Turlock, CA.

**Stack:** React 18 · Vite · React Three Fiber + @react-three/drei (3D hero) · Framer Motion (scroll & UI animation) · Lenis (smooth scroll)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Sections
1. **Hero:** a live "Open now / Closed" pill based on the shop's real hours. A 3D phone comes apart layer by layer as you scroll (display, logic board, battery, chassis, back glass), next to the repair each layer covers.
2. **Ticker:** Same-Day Service, Walk-Ins Welcome, 90-Day Warranty, and more.
3. **Services:** interactive device picker (6 categories) with a detail panel and a "Get Free Quote" button for the selected device.
4. **Stats:** animated counters (certified techs, 90-day warranty, 1,000+ repairs, 30-minute service).
5. **Before & after:** a draggable slider from a cracked screen to the repaired one, drawn in code so it stays sharp.
6. **Why Choose Us**, **How It Works** (progress line), **Visit** (hours, directions, map), **FAQ**, **call to action** and **footer**.

"Schedule Appointment" and "Get a Quote" open a form. Submitting it opens the visitor's email app with a message to info@downtownmobile.com already filled in.

## 3D performance
- three.js is code-split: it only loads with the hero scene.
- The render loop pauses once the hero is off screen.
- Lighting is a one-shot procedural environment, so no HDR files are downloaded.
- All geometry is procedural, so there are no model files. The phone screen and battery label are drawn on canvases so they stay crisp.

## Builds
- `npm run build`: the normal website, with an embedded Google map.
- `npx vite build --mode artifact`: a copy for hosts that block embedded sites. The map becomes a link card.

## Editing content
All business info (phone, hours, services, FAQ, gallery) lives in `src/data.js`.

# Downtown Mobile — Luxury Phone Repair Website

Premium single-page site for **Downtown Mobile**, 520 E Main St, Turlock, CA.

**Stack:** React 18 · Vite · React Three Fiber + @react-three/drei (3D hero) · Framer Motion (scroll & UI animation) · Lenis (smooth scroll)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Sections
1. **Hero:** pinned, scroll-driven R3F scene. A floating titanium-and-glass phone with a live liquid-gold shader screen turns to show its back and returns as you scroll, and leans toward the mouse. Gold orbit rings and sparkles complete the scene.
2. **Marquee:** Same-Day Service, Walk-Ins Welcome, 90-Day Warranty, and more.
3. **Services:** interactive device picker (6 categories) with an animated detail panel and a "Get Free Quote" button for the selected device.
4. **Trust pillars:** animated counters (Certified, 90-day warranty, 1,000+ repairs, 30-minute service).
5. **The Studio:** pinned cinematic image that expands from a card to full screen, with copy and glass cards.
6. **Why Choose Us:** mouse-tilt cards with glare.
7. **How It Works:** a gold progress rail that draws in as you scroll.
8. **Gallery:** horizontal scroll-driven gallery with parallax images.
9. **Visit:** address, hours, directions, and a dark-styled Google map.
10. **FAQ:** animated accordion.
11. **CTA and footer:** contact details, hours, and quick links.

"Schedule Appointment" and "Get a Quote" open a form. Submitting it opens the visitor's email app with a pre-filled message to info@downtownmobile.com, so no backend is needed.

## 3D performance
- three.js is code-split: it only loads with the hero scene.
- The render loop pauses once the hero is off screen (`frameloop="never"`).
- Lighting is a one-shot procedural environment (Lightformers), so no HDR files are downloaded.
- DPR is capped at 1.75. All geometry is procedural, so there are no model files.
- Respects `prefers-reduced-motion`.

## Images (made with Canva)
The photos in `public/images/` were generated with Canva AI. Only low-resolution previews could be downloaded in the build environment. The site detects low-res files and softens them on purpose. To make the site sharp, open each image in Canva, download it at full size, and save it over the file of the same name:

| File | Canva image |
|---|---|
| `public/images/shop-interior.jpg` | https://www.canva.com/M/MAHYeSKV1mY |
| `public/images/before-after.jpg`  | https://www.canva.com/M/MAHYeS8aQ0U |
| `public/images/technician.jpg`    | https://www.canva.com/M/MAHYeZj6Bbg |
| `public/images/phone-lineup.jpg`  | https://www.canva.com/M/MAHYeSUQAHY |

Any file wider than 1400px is shown crisp automatically. Real photos of the shop also work.

## Editing content
All business info (phone, hours, services, FAQ, gallery) lives in `src/data.js`.

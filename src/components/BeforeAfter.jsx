import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'
import { Button, Eyebrow, Icon, Reveal, useQuote } from './ui'

// Seeded so the crack pattern is identical on every render.
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function drawCracks(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const { width, height } = canvas.getBoundingClientRect()
  if (!width) return
  canvas.width = width * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const rand = rng(7)
  const ox = width * 0.32
  const oy = height * 0.4
  const reach = Math.hypot(width, height)

  // LCD bleed lines from the damaged panel
  for (const [x, c] of [
    [0.22, 'rgba(0,255,140,0.75)'],
    [0.24, 'rgba(255,0,200,0.6)'],
    [0.81, 'rgba(80,140,255,0.7)'],
  ]) {
    ctx.fillStyle = c
    ctx.fillRect(width * x, 0, 2, height)
  }
  const ink = ctx.createRadialGradient(ox, oy, 0, ox, oy, width * 0.35)
  ink.addColorStop(0, 'rgba(10,10,14,0.85)')
  ink.addColorStop(1, 'rgba(10,10,14,0)')
  ctx.fillStyle = ink
  ctx.fillRect(0, 0, width, height)

  const line = (pts, w, a) => {
    ctx.beginPath()
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.strokeStyle = `rgba(0,0,0,${a * 0.5})`
    ctx.lineWidth = w + 1.2
    ctx.stroke()
    ctx.strokeStyle = `rgba(255,255,255,${a})`
    ctx.lineWidth = w
    ctx.stroke()
  }

  const spokes = 15
  for (let i = 0; i < spokes; i++) {
    let ang = (i / spokes) * Math.PI * 2 + rand() * 0.35
    let x = ox
    let y = oy
    const pts = [[x, y]]
    const len = reach * (0.35 + rand() * 0.5)
    let travelled = 0
    while (travelled < len) {
      const step = 10 + rand() * 26
      ang += (rand() - 0.5) * 0.5
      x += Math.cos(ang) * step
      y += Math.sin(ang) * step
      travelled += step
      pts.push([x, y])
      if (rand() < 0.12) {
        const b = ang + (rand() > 0.5 ? 1 : -1) * (0.5 + rand() * 0.6)
        line([[x, y], [x + Math.cos(b) * 40 * rand(), y + Math.sin(b) * 40 * rand()]], 0.8, 0.6)
      }
    }
    line(pts, 1.2, 0.85)
  }
  for (let ring = 1; ring <= 3; ring++) {
    const rad = ring * 22 + rand() * 10
    for (let s = 0; s < 7; s++) {
      const a0 = rand() * Math.PI * 2
      const pts = []
      for (let k = 0; k <= 4; k++) {
        const a = a0 + k * 0.12
        const rr = rad + (rand() - 0.5) * 5
        pts.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr])
      }
      line(pts, 0.9, 0.7)
    }
  }
  const glare = ctx.createRadialGradient(ox, oy, 0, ox, oy, 26)
  glare.addColorStop(0, 'rgba(255,255,255,0.9)')
  glare.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glare
  ctx.fillRect(ox - 30, oy - 30, 60, 60)
}

function ScreenUI() {
  return (
    <div className="ba-ui">
      <span className="ba-island" />
      <p className="ba-date">Tuesday, Turlock</p>
      <p className="ba-time">10:24</p>
      <div className="ba-note">
        <span className="ba-app">DM</span>
        <span>
          <strong>Downtown Mobile</strong>
          Your phone is ready for pickup
        </span>
      </div>
    </div>
  )
}

export default function BeforeAfter() {
  const { open } = useQuote()
  const frame = useRef(null)
  const canvas = useRef(null)
  const [pos, setPos] = useState(78)
  const [touched, setTouched] = useState(false)
  const inView = useInView(frame, { once: true, margin: '-25% 0px' })

  useEffect(() => {
    const draw = () => drawCracks(canvas.current)
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(canvas.current)
    return () => ro.disconnect()
  }, [])

  // Sweep once on entry so visitors see it's draggable.
  useEffect(() => {
    if (!inView || touched) return
    const c = animate(78, 46, { duration: 1.6, delay: 0.3, ease: [0.65, 0, 0.35, 1], onUpdate: setPos })
    return () => c.stop()
  }, [inView, touched])

  const fromPointer = (e) => {
    const r = frame.current.getBoundingClientRect()
    setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)))
  }

  return (
    <section className="section results" id="studio">
      <div className="container results-grid">
        <div className="results-copy">
          <Eyebrow>Before &amp; after</Eyebrow>
          <Reveal as="h2" className="display-lg">
            Professional Repairs, Proven Results
          </Reveal>
          <Reveal as="p" className="lead" delay={0.1}>
            Our modern, fully-equipped repair facility features the latest tools and technology to restore your device to like-new condition. From
            shattered screens to complex water damage, we handle every repair with precision and care.
          </Reveal>
          <Reveal className="results-facts" delay={0.15}>
            <div>
              <Icon.bolt />
              <strong>Fast Service</strong>
              <span>30–60 minute repairs</span>
            </div>
            <div>
              <Icon.shield />
              <strong>Quality Parts</strong>
              <span>OEM-grade components</span>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <Button onClick={() => open('schedule')} icon={<Icon.arrow />}>
              Schedule Your Repair
            </Button>
          </Reveal>
        </div>

        <Reveal className="ba-wrap" delay={0.1}>
          <div
            className="ba-phone"
            ref={frame}
            onPointerDown={(e) => {
              setTouched(true)
              e.currentTarget.setPointerCapture(e.pointerId)
              fromPointer(e)
            }}
            onPointerMove={(e) => e.buttons && fromPointer(e)}
          >
            <div className="ba-screen ba-after">
              <ScreenUI />
            </div>
            <div className="ba-screen ba-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              <ScreenUI />
              <canvas ref={canvas} className="ba-cracks" />
            </div>
            <div className="ba-handle" style={{ left: `${pos}%` }}>
              <span>
                <Icon.arrow style={{ transform: 'scaleX(-1)' }} />
                <Icon.arrow />
              </span>
            </div>
            <span className="ba-tag ba-tag-before">Before</span>
            <span className="ba-tag ba-tag-after">
              <Icon.check width={14} height={14} /> After · 42 min
            </span>
            <input
              className="ba-range"
              type="range"
              min="0"
              max="100"
              value={Math.round(pos)}
              aria-label="Compare before and after repair"
              onChange={(e) => {
                setTouched(true)
                setPos(Number(e.target.value))
              }}
            />
          </div>
          <p className="ba-caption">Drag to compare a shattered screen with the same phone after a screen replacement.</p>
        </Reveal>
      </div>
    </section>
  )
}

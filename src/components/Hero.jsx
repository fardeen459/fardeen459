import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { BUSINESS, PARTS } from '../data'
import { Button, Icon, OpenPill, ease, useQuote } from './ui'

const PhoneScene = lazy(() => import('./PhoneScene'))

function PartRow({ item, i, progress }) {
  const start = 0.3 + i * 0.06
  const opacity = useTransform(progress, [start, start + 0.08], [0, 1])
  const x = useTransform(progress, [start, start + 0.08], [-24, 0])
  return (
    <motion.li style={{ opacity, x }}>
      <span className="part-no">{String(i + 1).padStart(2, '0')}</span>
      <span className="part-name">{item.part}</span>
      <span className="part-fix">{item.fix}</span>
    </motion.li>
  )
}

export default function Hero() {
  const ref = useRef(null)
  const inView = useInView(ref)
  const { open } = useQuote()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const aOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const aY = useTransform(scrollYProgress, [0, 0.2], [0, -60])
  const bOpacity = useTransform(scrollYProgress, [0.24, 0.34, 0.86, 0.96], [0, 1, 1, 0])
  const bY = useTransform(scrollYProgress, [0.24, 0.34], [40, 0])
  const hint = useTransform(scrollYProgress, [0, 0.06], [1, 0])

  const fade = (delay) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease } })

  return (
    <section ref={ref} className="hero" id="top">
      <div className="hero-sticky">
        <div className="hero-bg" />
        <Suspense fallback={null}>
          <PhoneScene progress={scrollYProgress} active={inView} />
        </Suspense>

        <motion.div className="hero-copy container" style={{ opacity: aOpacity, y: aY }}>
          <motion.div {...fade(0.1)}>
            <OpenPill />
          </motion.div>
          <motion.h1 className="hero-title" {...fade(0.2)}>
            Fast &amp; Affordable Phone Repair <span>in Turlock</span>
          </motion.h1>
          <motion.ul className="hero-badges" {...fade(0.35)}>
            <li>Same-Day Service</li>
            <li>Walk-Ins Welcome</li>
            <li>90-Day Warranty</li>
          </motion.ul>
          <motion.p className="hero-sub" {...fade(0.45)}>
            Expert repairs for iPhone, Samsung, Google Pixel, and more.
          </motion.p>
          <motion.div className="hero-ctas" {...fade(0.55)}>
            <Button onClick={() => open('schedule')} icon={<Icon.arrow />}>
              Schedule Appointment
            </Button>
            <Button variant="ghost" href={BUSINESS.phoneHref} icon={<Icon.phone />}>
              Call {BUSINESS.phone}
            </Button>
            <button type="button" className="link-underline" onClick={() => open('quote')}>
              Get a Quote
            </button>
          </motion.div>
        </motion.div>

        <motion.div className="hero-parts container" style={{ opacity: bOpacity, y: bY }}>
          <p className="eyebrow">Inside your phone</p>
          <h2 className="display-md">We fix every layer.</h2>
          <ol className="parts-list">
            {PARTS.map((p, i) => (
              <PartRow key={p.part} item={p} i={i} progress={scrollYProgress} />
            ))}
          </ol>
        </motion.div>

        <motion.div className="scroll-hint" style={{ opacity: hint }}>
          <span className="scroll-mouse" />
          Scroll to take it apart
        </motion.div>
      </div>
    </section>
  )
}

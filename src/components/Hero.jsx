import { lazy, Suspense, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { BUSINESS } from '../data'
import { Button, Icon, SplitWords, ease, useQuote } from './ui'

const PhoneScene = lazy(() => import('./PhoneScene'))

export default function Hero() {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px 0px 0px 0px' })
  const { open } = useQuote()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const aOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0])
  const aY = useTransform(scrollYProgress, [0, 0.22], [0, -80])
  const aBlur = useTransform(scrollYProgress, [0, 0.22], ['blur(0px)', 'blur(8px)'])

  const bOpacity = useTransform(scrollYProgress, [0.4, 0.55, 0.78, 0.9], [0, 1, 1, 0])
  const bY = useTransform(scrollYProgress, [0.4, 0.55, 0.78, 0.9], [60, 0, 0, -60])

  const glowScale = useTransform(scrollYProgress, [0, 1], [1, 1.6])
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0])

  return (
    <section ref={ref} className="hero" id="top">
      <div className="hero-sticky">
        <motion.div className="hero-glow" style={{ scale: glowScale }} />
        <div className="hero-grain" />
        <Suspense fallback={null}>
          <PhoneScene progress={scrollYProgress} active={inView} />
        </Suspense>

        <motion.div className="hero-copy container" style={{ opacity: aOpacity, y: aY, filter: aBlur }}>
          <motion.p
            className="hero-kicker"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5, ease }}
          >
            <span className="dot" /> Downtown Mobile · Turlock, California
          </motion.p>
          <h1 className="hero-title">
            <SplitWords as="span" immediate delay={1.6} className="hero-line" text="Fast & Affordable" />
            <SplitWords as="span" immediate delay={1.8} className="hero-line hero-line-gold" text="Phone Repair in Turlock" />
          </h1>
          <motion.p
            className="hero-badges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 2.3 }}
          >
            Same-Day Service <i>•</i> Walk-Ins Welcome <i>•</i> 90-Day Warranty
          </motion.p>
          <motion.p
            className="hero-sub"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 2.45, ease }}
          >
            Expert repairs for iPhone, Samsung, Google Pixel, and more.
          </motion.p>
          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 2.6, ease }}
          >
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

        <motion.div className="hero-copy-b container" style={{ opacity: bOpacity, y: bY }}>
          <div className="hero-b-inner">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              Restored, not replaced
            </p>
            <h2 className="display-md">
              Like-new. <em>Down to the last screw.</em>
            </h2>
            <ul className="spec-list">
              <li>
                <span>Parts</span>OEM-grade components
              </li>
              <li>
                <span>Time</span>30–60 minute repairs
              </li>
              <li>
                <span>Warranty</span>90 days, parts & labor
              </li>
            </ul>
          </div>
        </motion.div>

        <motion.div className="scroll-hint" style={{ opacity: hintOpacity }}>
          <span>Scroll</span>
          <span className="scroll-line" />
        </motion.div>
      </div>
    </section>
  )
}

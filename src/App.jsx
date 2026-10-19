import { useCallback, useEffect, useMemo, useState } from 'react'
import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion'
import { initSmoothScroll } from './scroll'
import { QuoteContext } from './components/ui'
import Intro from './components/Intro'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Devices from './components/Devices'
import Pillars from './components/Pillars'
import Showcase from './components/Showcase'
import Why from './components/Why'
import Process from './components/Process'
import Gallery from './components/Gallery'
import Visit from './components/Visit'
import Faq from './components/Faq'
import Cta from './components/Cta'
import Footer from './components/Footer'
import QuoteModal from './components/QuoteModal'

export default function App() {
  const [quote, setQuote] = useState(null)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  useEffect(() => initSmoothScroll(), [])

  const open = useCallback((mode = 'quote', device) => setQuote({ mode, device }), [])
  const close = useCallback(() => setQuote(null), [])
  const ctx = useMemo(() => ({ open }), [open])

  return (
    <MotionConfig reducedMotion="user">
      <QuoteContext.Provider value={ctx}>
        <Intro />
        <motion.div className="page-progress" style={{ scaleX: progress }} />
        <Nav />
        <main>
          <Hero />
          <Marquee />
          <Devices />
          <Pillars />
          <Showcase />
          <Why />
          <Process />
          <Gallery />
          <Visit />
          <Faq />
          <Cta />
        </main>
        <Footer />
        <QuoteModal state={quote} onClose={close} />
      </QuoteContext.Provider>
    </MotionConfig>
  )
}

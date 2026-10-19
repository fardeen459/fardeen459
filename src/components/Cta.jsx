import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { BUSINESS } from '../data'
import { Button, Icon, Reveal, SplitWords, useQuote } from './ui'

export default function Cta() {
  const ref = useRef(null)
  const { open } = useQuote()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const rotate = useTransform(scrollYProgress, [0, 1], [-30, 60])
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.7, 1.05])

  return (
    <section className="cta" ref={ref} id="contact">
      <motion.div className="cta-orb" style={{ rotate, scale }} aria-hidden="true" />
      <div className="container cta-inner">
        <SplitWords className="display-xl" text="Ready to Fix Your Phone?" />
        <Reveal as="p" className="lead" delay={0.2}>
          Schedule your appointment or walk in today for same-day service.
        </Reveal>
        <Reveal className="row-gap center" delay={0.3}>
          <Button onClick={() => open('schedule')} icon={<Icon.arrow />}>
            Schedule Now
          </Button>
          <Button variant="ghost" href={BUSINESS.phoneHref} icon={<Icon.phone />}>
            Call {BUSINESS.phone}
          </Button>
        </Reveal>
      </div>
    </section>
  )
}

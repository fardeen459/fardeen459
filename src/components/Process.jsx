import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { STEPS } from '../data'
import { Eyebrow, Reveal, SplitWords } from './ui'

function Step({ step, i, progress }) {
  const start = 0.15 + i * 0.22
  const on = useTransform(progress, [start, start + 0.12], [0.25, 1])
  const dot = useTransform(progress, [start, start + 0.08], [0, 1])
  return (
    <motion.li className="step" style={{ opacity: on }}>
      <motion.span className="step-dot" style={{ scale: dot }} />
      <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
      <h3>{step.title}</h3>
      <p>{step.text}</p>
    </motion.li>
  )
}

export default function Process() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 45%'] })
  const line = useTransform(scrollYProgress, [0.1, 0.8], [0, 1])

  return (
    <section className="section process" id="process" ref={ref}>
      <div className="container">
        <div className="section-head center">
          <Eyebrow>3 simple steps</Eyebrow>
          <SplitWords className="display-lg" text="How It Works" />
          <Reveal as="p" className="lead" delay={0.2}>
            Getting your phone repaired is easy with our simple 3-step process.
          </Reveal>
        </div>
        <div className="steps-wrap">
          <div className="steps-rail">
            <motion.div className="steps-rail-fill" style={{ '--p': line }} />
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <Step key={s.title} step={s} i={i} progress={scrollYProgress} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
